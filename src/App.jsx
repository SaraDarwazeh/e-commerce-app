import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import useAuthStore from './store/authStore';
import ToastContainer from './components/ui/Toast';
import ConfirmModal from './components/ui/ConfirmModal';

function App() {
  const initAuthListener = useAuthStore(state => state.initAuthListener);

  useEffect(() => {
    // Start listening to Firebase Auth state changes
    const unsubscribe = initAuthListener();
    return () => unsubscribe();
  }, [initAuthListener]);

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
      <ConfirmModal />
    </>
  );
}

export default App;
