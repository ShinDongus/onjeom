import React,{useMemo,useState} from "react";
import {Pressable,StyleSheet,Text,useWindowDimensions,View} from "react-native";
import DiaryPaper from "./DiaryPaper";
import FlowerArt from "./FlowerArt";
import {diaryDays,diaryForDay} from "../journal.mjs";
type Props={day:string;state:any;onSave:(day:string,text:string,mood:string|null)=>void;onOpenFlower:(id:string)=>void;};
const pad=(n:number)=>String(n).padStart(2,"0");
function calendarMonth(y:number,m:number){const first=new Date(y,m-1,1).getDay();const count=new Date(y,m,0).getDate();
 return Array.from({length:first+count},(_,i)=>i-first+1);
}
export default function DiaryHistory({day,state,onSave,onOpenFlower}:Props){
 const {width}=useWindowDimensions(),wide=width>=720;
 const [selected,setSelected]=useState(day);
 const [month,setMonth]=useState(day.slice(0,7));
 const [y,m]=month.split("-").map(Number);
 const days=useMemo(()=>new Set(diaryDays(state)),[state]);
 const record=diaryForDay(state,selected);
 const changeMonth=(diff:number)=>{const d=new Date(y,m-1+diff,1);setMonth(d.getFullYear()+"-"+pad(d.getMonth()+1));};
 return <View style={s.outer}>
  <View><Text style={s.eyebrow}>DAILY ARCHIVE</Text><Text accessibilityRole="header" style={s.title}>지난날의 페이지</Text></View>
  <View style={[s.cols,wide&&s.wide]}>
   <View style={s.calendar}>
    <View style={s.monthRow}>
     <Pressable accessibilityRole="button" accessibilityLabel="이전 달" onPress={()=>changeMonth(-1)} style={s.arrow}><Text style={s.arrowText}>‹</Text></Pressable>
     <Text style={s.month}>{y}년 {m}월</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="다음 달" onPress={()=>changeMonth(1)} style={s.arrow}><Text style={s.arrowText}>›</Text></Pressable>
    </View>
    <View style={s.grid}>{["일","월","화","수","목","금","토"].map(w=><View key={w} style={s.daySlot}><Text style={s.weekday}>{w}</Text></View>)}
     {calendarMonth(y,m).map((n,i)=>n<=0?<View key={"blank"+i} style={s.daySlot}/>:
      <Pressable key={i} accessibilityRole="button" accessibilityLabel={y+"년 "+m+"월 "+n+"일"}
       onPress={()=>setSelected(y+"-"+pad(m)+"-"+pad(n))}
       style={[s.daySlot,s.daySelect,selected===y+"-"+pad(m)+"-"+pad(n)&&s.activeDay]}>
       <Text style={[s.dayText,selected===y+"-"+pad(m)+"-"+pad(n)&&s.activeText]}>{n}</Text>
       {days.has(y+"-"+pad(m)+"-"+pad(n))&&<View style={[s.dot,selected===y+"-"+pad(m)+"-"+pad(n)&&s.activeDot]}/>}
      </Pressable>)}
    </View>
    <Text style={s.hint}>작은 점은 일기나 성취가 남은 날입니다.</Text>
    <Text style={s.sideNote}>한 페이지씩 천천히 쌓인 시간</Text>
   </View>
   <View style={s.page}>
    <Text style={s.selectedDate}>{selected.slice(5,7)}월 {selected.slice(8,10)}일의 기억</Text>
    <DiaryPaper key={selected} day={selected} entry={record.journal} onSave={onSave}/>
    <View style={s.achievements}>
     <Text style={s.section}>그날의 작은 성취</Text>
     {record.tasks.length===0?<Text style={s.empty}>남겨진 완료 기록이 없어요.</Text>:record.tasks.map((t:any)=><Text key={t.id} style={s.done}>✓ {t.title}</Text>)}
    </View>
    {record.flowers.length>0&&<View style={s.blooms}>
     <Text style={s.section}>이날 피어난 꽃</Text>
     <View style={s.flowerRow}>{record.flowers.map((f:any)=><Pressable key={f.id} onPress={()=>onOpenFlower(f.id)} accessibilityRole="button" style={s.flower}>
      <FlowerArt species={f.speciesId} color={f.color} stage={4} size={60}/>
      <Text style={s.flowerName}>{f.name}</Text>
     </Pressable>)}</View>
    </View>}
   </View>
  </View>
 </View>
}
const s=StyleSheet.create({
 outer:{gap:16,paddingBottom:20},eyebrow:{fontSize:11,letterSpacing:1.4,color:"#8E9F89",marginBottom:7},
 title:{fontSize:25,fontWeight:"700",color:"#314A38"},cols:{gap:19},wide:{flexDirection:"row",alignItems:"flex-start",gap:24},
 calendar:{minWidth:0,padding:16,backgroundColor:"#F3F0E6",borderRadius:20,...{}},page:{flex:1,minWidth:0,gap:12},
 monthRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:13},month:{fontSize:16,fontWeight:"600",color:"#3B543F"},
 arrow:{minHeight:42,minWidth:42,alignItems:"center",justifyContent:"center"},arrowText:{fontSize:26,color:"#7E9780"},
 grid:{flexDirection:"row",flexWrap:"wrap"},weekday:{fontSize:12,color:"#9AA594"},daySlot:{width:"14.2857%",minHeight:43,alignItems:"center",justifyContent:"center"},
 daySelect:{borderRadius:14,gap:3},activeDay:{backgroundColor:"#5B8063"},dayText:{fontSize:13,color:"#4B624E"},activeText:{color:"#fff",fontWeight:"700"},
 dot:{width:4,height:4,borderRadius:3,backgroundColor:"#8FAE90"},activeDot:{backgroundColor:"#fff"},
 hint:{fontSize:11,color:"#879685",marginTop:8},sideNote:{fontSize:13,color:"#748575",marginTop:14},
 selectedDate:{fontSize:15,fontWeight:"600",color:"#4C6851"},achievements:{gap:7,paddingTop:4},section:{fontSize:13,fontWeight:"600",color:"#4C6752"},
 empty:{fontSize:12,color:"#95A294"},done:{fontSize:13,color:"#49624C",lineHeight:22},
 blooms:{gap:5},flowerRow:{flexDirection:"row",flexWrap:"wrap",gap:8},
 flower:{padding:9,alignItems:"center",backgroundColor:"#E9EFE3",borderRadius:14,minWidth:86},flowerName:{fontSize:11,color:"#49654E"}
});
