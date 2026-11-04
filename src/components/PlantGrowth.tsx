import React, {useEffect,useRef} from "react";
import {Animated,StyleSheet,Text,View} from "react-native";
import FlowerArt from "./FlowerArt";

/** A small, non-interruptive animated moment. No waiting and no penalty. */
export default function PlantGrowth({progress,reduceMotion=false,season="봄"}:{
  progress:number; reduceMotion?:boolean; season?:string;
}){
 const growth=useRef(new Animated.Value(1)).current;
 const before=useRef(progress);
 useEffect(()=>{
   if(before.current===progress) return;
   before.current=progress;
   if(reduceMotion){growth.setValue(1);return;}
   growth.setValue(0.88);
   Animated.spring(growth,{toValue:1,friction:7,tension:85,useNativeDriver:true}).start();
 },[progress,reduceMotion,growth]);
 const scenery=season==="겨울"?"#F0EEE5":season==="가을"?"#F0E7D5":season==="여름"?"#E6EEDB":"#EEF1E4";
 return <View style={[s.scene,{backgroundColor:scenery}]}>
   <View style={s.caption}><Text style={s.eyebrow}>나의 작은 화분</Text><Text style={s.sub}>한 걸음마다 천천히 자라나요</Text></View>
   <Animated.View style={{transform:[{scale:growth}],alignItems:"center"}}>
     <FlowerArt stage={Math.max(0,Math.min(3,progress))} size={114} color="#D7A8A8"/>
   </Animated.View>
   <View style={s.progress}>
    {[0,1,2,3].map((n)=><View key={n} style={[s.pip,n<progress && s.pipDone]}/>)}
   </View>
   <Text style={s.status}>{["씨앗","새싹","작은 잎","꽃봉오리"][Math.max(0,Math.min(progress,3))]}</Text>
 </View>
}
const s=StyleSheet.create({
 scene:{borderRadius:24,padding:15,alignItems:"center",gap:3,borderWidth:1,borderColor:"#DFE5D8"},
 caption:{alignSelf:"stretch",gap:3},eyebrow:{fontSize:14,color:"#415B48",fontWeight:"600"},sub:{fontSize:11,color:"#84917F"},
 progress:{flexDirection:"row",gap:7,marginTop:3},
 pip:{width:24,height:5,borderRadius:5,backgroundColor:"#D2DDCD"},
 pipDone:{backgroundColor:"#7EA887"},status:{fontSize:11,color:"#6A826C"}
});
