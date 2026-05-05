import {useState,useEffect} from 'react'
import {useSelector,useDispatch} from 'react-redux'
import { useNavigate,Link } from 'react-router-dom'
import {toast} from 'react-toastify'
import { GoogleLogin } from '@react-oauth/google'
import { register, googleLogin, reset } from '../features/auth/authSlice'



const Register = () => {

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: ''
  })

  const {name,email,password,password2} = formData

  const navigate = useNavigate()
  const dispatch = useDispatch()

  const {user,isLoading,isError,isSuccess,message} = useSelector((state) => state.auth)

  useEffect(() => {
    if(isError){
      toast.error(message)
      dispatch(reset())
    }
    if(isSuccess ){
      toast.success('User Registered Successfully')
      navigate('/')
      dispatch(reset())
    }
    if(user && !isSuccess){
      navigate('/')
      
    }
  }, [user,isError,isSuccess,message,navigate,dispatch])


  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value
    }))
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if(password !== password2){
      toast.error('Passwords do not match')
    }else{
      const userData = {
        name,
        email,
        password
      }
      dispatch(register(userData))
    }
  }

  const handleGoogleSuccess = (credentialResponse) => {
    if (credentialResponse.credential) {
      dispatch(googleLogin(credentialResponse.credential))
    } else {
      toast.error('Something went wrong. Please try again.')
    }
  }

  if(isLoading){
    return(
      <div className='flex justify-center items-center h-screen'>
      <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500'></div>
      </div>
    )
  }

  return (
    <div className='flex justify-center items-center min-h-[90vh] bg-gray-50 dark:bg-slate-950 sm:px-6 py-10'>
      <div className='w-full max-w-md bg-white dark:bg-slate-900 p-6 sm:p-10 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl dark:shadow-none' >
        <div className='text-center mb-8'>
          <h2 className='text-xs font-black uppercase tracking-[0.3em] text-teal-600 dark:text-teal-400 mb-2'>MockMate AI</h2>
          <h1 className='text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-tight'>Get <span className='text-teal-500'>Started</span></h1>
          <p className='text-gray-500 dark:text-slate-400 mt-3 text-sm sm:text-base px-2'>
            Join thousands of developers practicing with MockMate AI
          </p>
        </div>

        <form onSubmit={onSubmit} className='grid grid-cols-1 gap-4'>
          <div className='space-y-1'>
            <label className='text-[10px] font-bold uppercase text-gray-400 dark:text-slate-500 ml-1'>Full Name</label>
            <input type="text" name="name" value={name} className='w-full p-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all' placeholder='Anirudh Bhatt' onChange={onChange} required />
          </div>
          <div className='space-y-1'>
            <label className='text-[10px] font-bold uppercase text-gray-400 dark:text-slate-500 ml-1'>Email</label>
            <input type="email" name="email" value={email} className='w-full p-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all' placeholder='anirudhbhatt58@gmail.com' onChange={onChange} required />
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='space-y-1'>
              <label className='text-[10px] font-bold uppercase text-gray-400 dark:text-slate-500 ml-1'>Password</label>
              <input type="password" name="password" value={password} className='w-full p-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all' placeholder='********' onChange={onChange} required />
            </div>
            <div className='space-y-1'>
              <label className='text-[10px] font-bold uppercase text-gray-400 dark:text-slate-500 ml-1'>Confirm</label>
              <input type="password" name="password2" value={password2} className='w-full p-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all' placeholder='********' onChange={onChange} required />
            </div>
          </div>
          <button type="submit" className='w-full bg-teal-600 text-white p-3.5 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 mt-4 active:scale-[0.98]'>Create My Account</button>
        </form>

        <div className="my-8 flex items-center">
          <div className="flex-grow border-t border-gray-300 dark:border-slate-800"></div>
          <span className="mx-4 text-gray-400 dark:text-slate-500 text-[10px] font-black tracking-widest uppercase">Or</span>
          <div className="flex-grow border-t border-gray-300 dark:border-slate-800"></div>
        </div>

        <div className="w-full flex items-center justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error('Google signup failed')}
            theme="outline"
            size="large"
            width="100%"
            text="signup_with"
            shape="circle"
          />
        </div>

        <p className='mt-8 text-center text-sm text-gray-500 dark:text-slate-400 '>Already have an account? <Link to="/login" className='text-teal-600 dark:text-teal-400 font-bold hover:underline'>Sign In</Link></p>

      </div>

    </div>
  )
}

export default Register
