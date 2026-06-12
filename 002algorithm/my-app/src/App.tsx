import './App.css'
import { useRef, useState } from 'react';

function App() {
  function useDebounce(fn, delay) {
    const timerRef = useRef(null);

    return function (...args) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    }
  }

  function useThrottle(fn, interval) {
    const lastTimeRef = useRef(0);

    return function (...args) {
      const now = Date.now();

      if (now - lastTimeRef.current >= interval) {
        fn.apply(this, args);
        lastTimeRef.current = now;
      }
    }
  }

  const [value, setValue] = useState('');

  const debouncedLog = useDebounce((num) => {
    console.log('防抖执行：' + num);
  }, 500);

  const throttledLog = useThrottle((num) => {
    console.log('节流执行：' + num);
  }, 500);

  return (
    <div>
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          debouncedLog(e.target.value);
        }}
      />

      <button onClick={() => throttledLog(Date.now())}>节流按钮</button>
  </div>
  )
}

export default App
