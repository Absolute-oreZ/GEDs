import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthLayout, SignIn, SignUp, RootLayout, Channels, Profile, MeetingWrapper } from "./routes";

function App() {

  return (
    <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
          </Route>

          <Route element={<RootLayout />}>
            <Route index element={<Channels />} />
            <Route path='/profile' element={<Profile />} />
            <Route path='/meeting' element={<MeetingWrapper />} />
          </Route>
        </Routes>
    </BrowserRouter>
  )
}

export default App
