import { useState } from "react";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handelSubmit(event) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Tous les champs sont obligatoires.");
      return;
    }
    setError("");
  }
  return (
    <main>
      <h1>Connexion LMS</h1>
      <form onSubmit={handelSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input type="email" id="email" value={email} onChange={(event)=>
            setEmail(event.target.value)
          } />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input type="password " id="password" value={password} onChange={(event)=>
            setPassword(event.target.value)
          } />
        </div>

        {error && <p role="alert">{error}</p>}
        <button type='submit'>Se connecter</button>
      </form>
    </main>
  );
}

export default LoginPage;