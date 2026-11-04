import React,{useEffect,useRef,useState} from "react";
import {Pressable,StyleSheet,Text,TextInput,View} from "react-native";
const moods=["맑음","보통","복잡함","지침"];
type Journal = {text:string;mood:string|null};
export default function DiaryPaper({day,entry,onSave,readOnly=false}:{
 day:string;entry:Journal;onSave:(day:string,text:string,mood:string|null)=>void;readOnly?:boolean;
}){
 const [draft,setDraft]=useState(entry?.text||"");
 const [mood,setMood]=useState<string|null>(entry?.mood||null);
 const edited=useRef(false);
 useEffect(()=>{setDraft(entry?.text||"");setMood(entry?.mood||null);edited.current=false;},[day]);
 useEffect(()=>{
  if(!edited.current || (draft===(entry?.text||"") && mood===(entry?.mood||null)))return;
  const id=setTimeout(()=>{onSave(day,draft,mood);edited.current=false;},750);
  return ()=>clearTimeout(id);
 },[day,draft,mood,entry?.text,entry?.mood,onSave]);
 const flush=()=>{if(edited.current){onSave(day,draft,mood);edited.current=false;}};
 return <View style={s.outer}>
  <View style={s.top}>
   <Text style={s.label}>오늘의 생각 · MY PAGE</Text>
   <Text style={s.date}>{day.slice(5,7)}.{day.slice(8,10)}</Text>
  </View>
  <View style={s.paper}>
   <View pointerEvents="none" style={s.lines}>{Array.from({length:7},(_,i)=><View key={i} style={s.line}/>)}</View>
   <TextInput accessibilityLabel={day+"의 일기 작성"} multiline
    textAlignVertical="top" placeholder="마음에 남은 일이나 생각을 적어보세요.\n한 줄이어도 충분해요."
    placeholderTextColor="#A1A89A" style={s.input} maxLength={10000} value={draft}
    onChangeText={v=>{edited.current=true;setDraft(v);}}
    onBlur={flush} editable={!readOnly} />
  </View>
  <View style={s.moodRow}>
   <Text style={s.moodLabel}>오늘의 기분</Text>
   <View style={s.moods}>{moods.map(m=><Pressable key={m} accessibilityRole="button"
     accessibilityState={{selected:mood===m}} accessibilityLabel={"오늘의 기분 "+m}
     onPress={()=>{const v=mood===m?null:m;edited.current=true;setMood(v);onSave(day,draft,v);edited.current=false;}}
     style={[s.chip,mood===m&&s.chipOn]}>
      <Text style={[s.chipText,mood===m&&s.chipTextOn]}>{m}</Text>
   </Pressable>)}</View>
  </View>
  <Text style={s.foot}>기록은 이 기기에 보관됩니다. · 감정 선택은 자유로워요.</Text>
 </View>
}
const s=StyleSheet.create({
 outer:{backgroundColor:"#FFFDF6",borderWidth:1,borderColor:"#E7E2D5",borderRadius:21,padding:16,gap:11,shadowColor:"#806D4C",shadowOpacity:0.045,shadowRadius:10},
 top:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},label:{fontSize:11,letterSpacing:1,color:"#7A8C7B",fontWeight:"600"},date:{fontSize:12,color:"#A18D70"},
 paper:{minHeight:210,position:"relative"},lines:{position:"absolute",top:4,left:0,right:0},
 line:{height:30,borderBottomWidth:1,borderBottomColor:"#EAE8DF"},
 input:{minHeight:210,maxHeight:360,backgroundColor:"transparent",fontSize:15,lineHeight:30,color:"#3B5142",padding:0,paddingTop:0},
 moodRow:{gap:9},moodLabel:{fontSize:12,color:"#697A6B"},
 moods:{flexDirection:"row",flexWrap:"wrap",gap:7},
 chip:{paddingVertical:7,paddingHorizontal:10,borderRadius:16,borderWidth:1,borderColor:"#E3E5DB",backgroundColor:"#F8F8F0",minHeight:36,justifyContent:"center"},
 chipOn:{backgroundColor:"#DAE6D8",borderColor:"#99B49B"},
 chipText:{fontSize:12,color:"#788779"},chipTextOn:{color:"#2F543C",fontWeight:"700"},
 foot:{fontSize:10,color:"#A1A99C"}
});
