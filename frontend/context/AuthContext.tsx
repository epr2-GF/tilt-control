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
  loginUser: (token: string) => Promise<void>;
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
const loginUser = async (authToken:string)=>{

  localStorage.setItem(
    "smart-site-token",
    authToken
  );

  setToken(authToken);

  try {

const me = await getMe();

setUser(me);

  } catch(err){

    console.error(
      "Login verification failed:",
      err
    );

    setUser(null);

  }

};



  /*
  LOGOUT
  */
const logout = async () => {

  try {

    await apiFetch(
      "/session/logout",
      {
        method: "POST",
      }
    );

  } catch (error) {

    // Still complete local logout
    // if the backend is unavailable.

  }

  localStorage.removeItem(
    "smart-site-token"
  );

  setToken(null);

  setUser(null);

};



  /*
  REFRESH USER
  */
const refreshUser = async () => {
  try {
    const me = await getMe();

    setUser(me);

  } catch (error) {

    console.error(
      "GETME FAILED - session retained:",
      error
    );

    // Do NOT logout here.
    //
    // apiFetch() handles 401/403 authentication
    // failures and redirects to /login.
    //
    // Temporary network/API failures should not
    // destroy a valid 7-day JWT.
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

        setUser(me);


      } catch(error){

        console.error(
          "Session restore failed",
          error
        );


        logout();

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