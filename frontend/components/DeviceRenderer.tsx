"use client";

import BinaryControl from "@/components/BinaryControl";
import RollerShutterCard from "@/components/RollerShutterCard";
import SensorCard from "@/components/SensorCard";

import { ArrowRightLeft } from "lucide-react";


export default function DeviceRenderer({
  device
}:{
  device:any
}){


switch(device.cardType){


case "rollerShutter":

return (

<RollerShutterCard
  key={device.id}
  device={device}
/>

);


case "binary":

return (

<BinaryControl

controlId={device.id.toString()}

commandEntity={device.entityId}

statusEntity={device.statusEntity || device.entityId}

title={device.name}

description={device.description}

icon={<ArrowRightLeft size={20}/>}

onText={device.statusTrue || "ON"}

offText={device.statusFalse || "OFF"}

buttonText="Commander"

/>

);



case "sensor":

return (

<SensorCard

title={device.name}

value="--"

unit=""

/>

);



default:

return null;


}


}