"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { getMe, apiFetch } from "@/lib/api";

import { User } from "@/types/user";


type AuthContextType = {
  user: User | null | undefined;
  token: string | null;
  loginUser: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};


const AuthContext = createContext<AuthContextType | null>(null);


export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {


  const [user, setUser] =
    useState<User | null | undefined>(undefined);

  const [token, setToken] =
    useState<string | null>(null);



  /*
  LOGIN
  */
const loginUser = async (authToken: string): Promise<boolean> => {

  localStorage.setItem(
    "smart-site-token",
    authToken
  );

  setToken(authToken);

  try {

    const me = await getMe();

    // Ignore the response if another login/logout
    // has changed the stored token.
    if (
      localStorage.getItem("smart-site-token") !== authToken
    ) {
      return false;
    }

    setUser(me);

    return true;

  } catch (err) {

    console.error(
      "Login verification failed:",
      err
    );

    // Do not clear a newer session.
    if (
      localStorage.getItem("smart-site-token") === authToken
    ) {
      localStorage.removeItem("smart-site-token");

      setToken(null);
      setUser(null);
    }

    return false;

  }

};



  /*
  LOGOUT
  */
const logout = async () => {

  const logoutToken =
    localStorage.getItem("smart-site-token");

  // Complete local logout immediately.
  localStorage.removeItem("smart-site-token");

  setToken(null);
  setUser(null);

  // Notify the backend using the old session token.
  if (logoutToken) {
    try {

      await apiFetch(
        "/session/logout",
        {
          method: "POST",
        },
        logoutToken
      );

    } catch (error) {

      // Local logout is already complete.
    }
  }

};



  /*
  REFRESH USER
  */
const refreshUser = async () => {

  const requestToken =
    localStorage.getItem("smart-site-token");

  if (!requestToken) {
    return;
  }

  try {

    const me = await getMe();

    // Ignore responses from an old session.
    if (
      localStorage.getItem("smart-site-token") !== requestToken
    ) {
      return;
    }

    setUser(me);

  } catch (error) {

    console.error(
      "GETME FAILED - session retained:",
      error
    );

    // Do not log out on temporary network failures.
  }

};



  /*
  RESTORE SESSION
  */
  useEffect(()=>{


    const init = async()=>{


      const storedToken =
        localStorage.getItem(
          "smart-site-token"
        );


      if(!storedToken){

        setUser(null);

        return;

      }


      setToken(storedToken);

try {

  const me = await getMe();

  if (
    localStorage.getItem("smart-site-token") !== storedToken
  ) {
    return;
  }

  setUser(me);

} catch (error) {

  console.error(
    "Session restore failed",
    error
  );

  if (
    localStorage.getItem("smart-site-token") === storedToken
  ) {
    setUser(null);
  }

}


    };


    init();


  },[]);




  /*
  SESSION CHECK EVERY 30s
  */
  useEffect(()=>{


    if(!user)
      return;


    const timer =
      setInterval(()=>{

        refreshUser();

      },30000);



    return ()=>clearInterval(timer);



  },[user]);




  /*
  HEARTBEAT
  */
  useEffect(()=>{


    if(!user)
      return;


    const heartbeat =
      async()=>{

        try{

          await apiFetch(
            "/session/heartbeat",
            {
              method:"POST"
            }
          );


        }catch(error){

          console.error(
            "Heartbeat failed",
            error
          );

        }

      };


    heartbeat();


    const timer =
      setInterval(
        heartbeat,
        30000
      );


    return ()=>clearInterval(timer);



  },[user]);





  return (

    <AuthContext.Provider
      value={{
        user,
        token,
        loginUser,
        logout,
        refreshUser,
      }}
    >

      {children}

    </AuthContext.Provider>

  );

}




export function useAuth(){

  const context =
    useContext(AuthContext);


  if(!context){

    throw new Error(
      "useAuth must be inside AuthProvider"
    );

  }


  return context;

}