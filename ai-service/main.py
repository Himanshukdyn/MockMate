import uvicorn
import os
import io
import json
import tempfile
from fastapi import FastAPI,HTTPException,UploadFile,File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional
import ollama
import whisper
from pydub import AudioSegment

load_dotenv()

AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT",8000))
OLLAMA_MODEL_NAME=os.getenv("OLLAMA_MODEL_NAME","mistral")
GROQ_API_KEY=os.getenv("GROQ_API_KEY","")
GROQ_MODEL_NAME=os.getenv("GROQ_MODEL_NAME","llama-3.3-70b-versatile")

# --- Groq Client Setup ---
groq_client = None
if GROQ_API_KEY:
    try:
        from groq import Groq
        groq_client = Groq(api_key=GROQ_API_KEY)
        print(f"✅ Groq client initialized (model: {GROQ_MODEL_NAME})")
    except Exception as e:
        print(f"⚠️ Groq client failed to initialize: {e}")
        groq_client = None
else:
    print("⚠️ No GROQ_API_KEY found. Using Ollama only.")

app=FastAPI(title="AI Interviewer Microservice",version="1.0")

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Removed local Whisper model loading to use Groq API instead

class QuestionResquest(BaseModel):
    role:str="MERN Stack Developer"
    level:str="Junior"
    count:int=5
    interview_type:str="coding-mix"
    resume_text:Optional[str]=None


class QuestionResponse(BaseModel):
    questions:list[str]
    model_used:str

class EvaluationRequest(BaseModel):
    question:str
    question_type:str
    role:str
    level:str
    user_answer:Optional[str]=None
    user_code:Optional[str]=None

class EvaluationResponse(BaseModel):
    technicalScore:int
    confidenceScore:int
    aiFeedback:str
    idealAnswer:str


# --- Helper: Generate with Groq (fast) ---
def generate_with_groq(system_prompt: str, user_prompt: str, temperature: float = 0.6, json_mode: bool = False):
    """Call Groq API. Returns the response text or raises an exception."""
    kwargs = {
        "model": GROQ_MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": temperature,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    response = groq_client.chat.completions.create(**kwargs)
    return response.choices[0].message.content.strip()


# --- Helper: Generate with Ollama (slow fallback) ---
def generate_with_ollama(system_prompt: str, user_prompt: str, temperature: float = 0.6, json_mode: bool = False):
    """Call local Ollama. Returns the response text."""
    kwargs = {
        "model": OLLAMA_MODEL_NAME,
        "prompt": user_prompt,
        "system": system_prompt,
        "options": {"temperature": temperature},
    }
    if json_mode:
        kwargs["format"] = "json"

    response = ollama.generate(**kwargs)
    return response['response'].strip()


# --- Unified generate with automatic fallback ---
def generate_text(system_prompt: str, user_prompt: str, temperature: float = 0.6, json_mode: bool = False):
    """Try Groq first, fall back to Ollama if Groq fails or is unavailable."""
    if groq_client:
        try:
            result = generate_with_groq(system_prompt, user_prompt, temperature, json_mode)
            print(f"✅ Used Groq ({GROQ_MODEL_NAME})")
            return result, f"groq/{GROQ_MODEL_NAME}"
        except Exception as e:
            print(f"⚠️ Groq failed ({e}), falling back to Ollama...")

    # Fallback to Ollama
    result = generate_with_ollama(system_prompt, user_prompt, temperature, json_mode)
    print(f"🐢 Used Ollama ({OLLAMA_MODEL_NAME})")
    return result, f"ollama/{OLLAMA_MODEL_NAME}"


@app.get("/")
async def root():
    provider = f"groq/{GROQ_MODEL_NAME}" if groq_client else f"ollama/{OLLAMA_MODEL_NAME}"
    return {"message":"Hello from AI Interviewer Microservice !","model": provider}


@app.post("/generate-questions",response_model=QuestionResponse)
async def generate_questions(request:QuestionResquest):
   
    try:
        if request.interview_type=="coding-mix":
            coding_count=int(request.count*0.2)
            oral_oral=int(request.count)-int(coding_count)

            intruction=(
                f"The first {coding_count} questions MUST be coding challenge requiring function implementation."
                f"The remaining {oral_oral} questions MUST be conceptual oral questions."
            )
        else :
            intruction="All questions MUST be conceptual oral questions. Do Not generate any coding or implementation challenges."

        resume_context = f"TAILOR TO RESUME: The candidate has the following resume text:\n{request.resume_text}\nPlease heavily tailor the questions to the specific skills, projects, and technologies mentioned in this resume." if request.resume_text else ""

        system_prompt=(
            "You are a professional technical interviewer. "
            "Task: Generate interview questions. No conversational text or numbering. "
            f"Crucial : {intruction} "
            f"{resume_context} "
            "Output exactly one question per line. "
        )

        user_prompt=(
            f"Generate exactly {request.count} unique interview questions for a {request.level}  level {request.role} "
        )
        
        raw_text, model_used = generate_text(system_prompt, user_prompt, temperature=0.6)

        questions=[q.strip() for q in raw_text.split('\n') if q.strip()]
        return QuestionResponse(questions=questions[:request.count],model_used=model_used)

    except Exception as e:
        raise HTTPException(status_code=500,detail=str(e))
    

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        if not groq_client:
            raise HTTPException(status_code=503, detail="Groq client is not initialized")
            
        audio_bytes = await file.read()
        
        # Write bytes to a temporary file with .webm extension so Groq recognizes it
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(audio_bytes)
            temp_audio_path = tmp.name
            
        try:
            # Send directly to Groq Whisper API (supports .webm)
            with open(temp_audio_path, "rb") as audio_file:
                transcription = groq_client.audio.transcriptions.create(
                    file=(os.path.basename(temp_audio_path), audio_file.read()),
                    model="whisper-large-v3",
                    response_format="json",
                )
            
            return {"transcription": transcription.text.strip()}
        finally:
            # Ensure cleanup happens even if API fails
            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)

    except Exception as e:
        print(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/evaluate",response_model=EvaluationResponse)
async def evaluate(request:EvaluationRequest):
    try:
        if request.question_type=="oral":
            assessment_intruction=(
                "This is a conceptual oral question. The candidate may provide their answer verbally (Verbal Answer) OR typed (Code Answer). "
                "Evaluate their explanation for conceptual correctness. "
                "CRITICAL: If BOTH the transcript and typed answer are empty, nonsense (e.g. 'blah blah', 'testing') or irrelevant to the question, SCORE 0."
            )
        else:
            assessment_intruction=(
                "This is a coding challenge question. Evaluate the code logic and efficiency. "
                "Use the transcription only for insight into their thought process. "
                "CRITICAL: If the code is 'udefined',empty, just random comments, or random characters, SCORE 0."
            )
        
        system_prompt=(
            "You are a sstrict technical interviewer. "
            "Do NOT hallucinate positive reviews for bad input. "
            "RULE 1: If the answer is gibberish, irrelevant, or missing, return 'technicalScore':0 and 'confidenceScore':0. "
            "RULE 2: For 'idealAnswer', provide a clean Markdown string.Do NOT return a nested JSON object. "
            f"Context:{assessment_intruction}"
            "Respond ONLY with a JSON object. "
            "Required keys: 'technicalScore' (0-100), 'confidenceScore' (0-100), 'aiFeedback', 'idealAnswer'. "
        )
        user_prompt=(
           
            f"Role: {request.role}\n"
            f"Question: {request.question}\n"
            f"Level: {request.level}\n"
            f"Verbal Answer: {request.user_answer or 'No verbal answer provided'}\n"
            f"Code Answer: {request.user_code or 'No code provided'}\n"
        )
        
        response_text, _ = generate_text(system_prompt, user_prompt, temperature=0.1, json_mode=True)
        
        try:
            evaluation_data=json.loads(response_text)
            if 'idealAnswer' in evaluation_data and not isinstance(evaluation_data['idealAnswer'],str):
                evaluation_data['idealAnswer']=json.dumps(evaluation_data['idealAnswer'])
            return EvaluationResponse(**evaluation_data)
        except json.JSONDecodeError:
            import re
            fixed_text=re.sub(r'[\r\n\t]',' ',response_text)
            try :
                evaluation_data=json.loads(fixed_text)
                if 'idealAnswer' in evaluation_data and not isinstance(evaluation_data['idealAnswer'],str):
                    evaluation_data['idealAnswer']=json.dumps(evaluation_data['idealAnswer'])
                return EvaluationResponse(**evaluation_data)
            except :
                print(f"Failed to parse response: {response_text}")
                return EvaluationResponse(technicalScore=0,confidenceScore=0,aiFeedback="Failed to parse response",idealAnswer="Failed to parse response")

    except Exception as e:
        print(f"Failed to generate response: {e}")
        raise HTTPException(status_code=500,detail=str(e))
        

if __name__ == "__main__":
    uvicorn.run(app,host="0.0.0.0",port=AI_SERVICE_PORT)