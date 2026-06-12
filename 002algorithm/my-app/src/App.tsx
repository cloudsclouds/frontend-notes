import './App.css'
import { useEffect, useState } from 'react';



function App() {
  function useInterval(callback, delay) {
    useEffect(()=> {
      const timer = setInterval(()=> { 
        callback()
      }, delay);
  
      return () => {
        clearInterval(timer);
      }
  
    }, [callback, delay])
  }

  const [count, setCount] = useState(10);

  useInterval(() => {
    if (count > 0) {
      setCount(count - 1);
    }
  }, 1000);

  return (
   <div>
    <h1>倒计时: {count}</h1>
   </div>
  )
}

export default App
