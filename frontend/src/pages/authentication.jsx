// import * as React from "react";
// import Avatar from "@mui/material/Avatar";
// import Button from "@mui/material/Button";
// import CssBaseline from "@mui/material/CssBaseline";
// import TextField from "@mui/material/TextField";
// import FormControlLabel from "@mui/material/FormControlLabel";
// import Checkbox from "@mui/material/Checkbox";
// import Link from "@mui/material/Link";
// import Paper from "@mui/material/Paper";
// import Box from "@mui/material/Box";
// import Grid from "@mui/material/Grid";
// import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
// import Typography from "@mui/material/Typography";
// import { createTheme, ThemeProvider } from "@mui/material/styles";
// import { AuthContext } from "../contexts/AuthContext";
// import { Snackbar } from "@mui/material";
// import "../styles/auth.css";

// // TODO remove, this demo shouldn't need to reset the theme.

// const defaultTheme = createTheme();

// export default function Authentication() {
//   const [username, setUsername] = React.useState();
//   const [password, setPassword] = React.useState();
//   const [name, setName] = React.useState();
//   const [error, setError] = React.useState();
//   const [message, setMessage] = React.useState();

//   const [formState, setFormState] = React.useState(0);

//   const [open, setOpen] = React.useState(false);

//   const { handleRegister, handleLogin } = React.useContext(AuthContext);

//   let handleAuth = async () => {
//     try {
//       if (formState === 0) {
//         let result = await handleLogin(username, password);
//       }
//       if (formState === 1) {
//         let result = await handleRegister(name, username, password);
//         console.log(result);
//         setUsername("");
//         setMessage(result);
//         setOpen(true);
//         setError("");
//         setFormState(0);
//         setPassword("");
//       }
//     } catch (err) {
//       console.log(err);
//       let message = err.response.data.message;
//       setError(message);
//     }
//   };

//   return (
//     <ThemeProvider theme={defaultTheme}>
//       <Grid container component="main" sx={{ height: "100vh" }}>
//         <CssBaseline />
//         <Grid
//           item
//           xs={false}
//           sm={4}
//           md={7}
//           sx={{
//             backgroundImage:
//               "url(https://source.unsplash.com/random?wallpapers)",
//             backgroundRepeat: "no-repeat",
//             backgroundColor: (t) =>
//               t.palette.mode === "light"
//                 ? t.palette.grey[50]
//                 : t.palette.grey[900],
//             backgroundSize: "cover",
//             backgroundPosition: "center",
//           }}
//         />
//         <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
//           <Box
//             sx={{
//               my: 8,
//               mx: 4,
//               display: "flex",
//               flexDirection: "column",
//               alignItems: "center",
//             }}
//           >
//             <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
//               <LockOutlinedIcon />
//             </Avatar>

//             <div>
//               <Button
//                 variant={formState === 0 ? "contained" : ""}
//                 onClick={() => {
//                   setFormState(0);
//                 }}
//               >
//                 Sign In
//               </Button>
//               <Button
//                 variant={formState === 1 ? "contained" : ""}
//                 onClick={() => {
//                   setFormState(1);
//                 }}
//               >
//                 Sign Up
//               </Button>
//             </div>

//             <Box component="form" noValidate sx={{ mt: 1 }}>
//               {formState === 1 ? (
//                 <TextField
//                   margin="normal"
//                   required
//                   fullWidth
//                   id="username"
//                   label="Full Name"
//                   name="username"
//                   value={name}
//                   autoFocus
//                   onChange={(e) => setName(e.target.value)}
//                 />
//               ) : (
//                 <></>
//               )}

//               <TextField
//                 margin="normal"
//                 required
//                 fullWidth
//                 id="username"
//                 label="Username"
//                 name="username"
//                 value={username}
//                 autoFocus
//                 onChange={(e) => setUsername(e.target.value)}
//               />
//               <TextField
//                 margin="normal"
//                 required
//                 fullWidth
//                 name="password"
//                 label="Password"
//                 value={password}
//                 type="password"
//                 onChange={(e) => setPassword(e.target.value)}
//                 id="password"
//               />

//               <p style={{ color: "red" }}>{error}</p>

//               <Button
//                 type="button"
//                 fullWidth
//                 variant="contained"
//                 sx={{ mt: 3, mb: 2 }}
//                 onClick={handleAuth}
//               >
//                 {formState === 0 ? "Login " : "Register"}
//               </Button>
//             </Box>
//           </Box>
//         </Grid>
//       </Grid>

//       <Snackbar open={open} autoHideDuration={4000} message={message} />
//     </ThemeProvider>
//   );
// }

import * as React from "react";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/auth.css";

export default function Authentication() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [formState, setFormState] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  let handleAuth = async () => {
    setIsLoading(true);
    try {
      if (formState === 0) {
        let result = await handleLogin(username, password);
      }
      if (formState === 1) {
        let result = await handleRegister(name, username, password);
        console.log(result);
        setUsername("");
        setMessage(result);
        setOpen(true);
        setError("");
        setFormState(0);
        setPassword("");
      }
    } catch (err) {
      console.log(err);
      let message = err.response.data.message;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormStateChange = (state) => {
    setIsLoading(true);
    setTimeout(() => {
      setFormState(state);
      setIsLoading(false);
    }, 500); // Simulate a short delay for Sign In/Sign Up toggle
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <div className="auth-form-box">
          {isLoading && <div className="auth-loader"></div>}
          <div className="auth-avatar">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C9.24 2 7 4.24 7 7c0 1.24.44 2.37 1.16 3.27C6.29 11.22 5 12.98 5 15v2c0 .55.45 1 1 1h1v1c0 1.66 1.34 3 3 3h4c1.66 0 3-1.34 3-3v-1h1c.55 0 1-.45 1-1v-2c0-2.02-1.29-3.78-3.16-4.73C16.56 9.37 17 8.24 17 7c0-2.76-2.24-5-5-5zm3 17c0 .55-.45 1-1 1h-4c-.55 0-1-.45-1-1v-1h6v1zm-3-3c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
            </svg>
          </div>

          <div className="auth-button-group">
            <button
              className={formState === 0 ? "active" : ""}
              onClick={() => handleFormStateChange(0)}
              disabled={isLoading}
            >
              Sign In
            </button>
            <button
              className={formState === 1 ? "active" : ""}
              onClick={() => handleFormStateChange(1)}
              disabled={isLoading}
            >
              Sign Up
            </button>
          </div>

          <form className="auth-form">
            {formState === 1 && (
              <div>
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  disabled={isLoading}
                />
              </div>
            )}
            <div>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus={formState === 0}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <p className="auth-error">{error}</p>
            <button
              type="button"
              className="auth-submit-button"
              onClick={handleAuth}
              disabled={isLoading}
            >
              {formState === 0 ? "Login" : "Register"}
            </button>
          </form>
          {open && <div className="auth-snackbar">{message}</div>}
        </div>
      </div>
    </div>
  );
}
