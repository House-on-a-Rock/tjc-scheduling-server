import { useState } from 'react';

// this became unnecessary for now, but i'll leave it in case
export const useAlert = () => {
  const [alert, setAlert] = useState(null); // we will change this to HttpResponseStatus (also in models) later
  return [alert, setAlert];
};