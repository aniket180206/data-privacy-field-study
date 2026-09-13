const SURVEY_FORM_ID="1AgcQ2vID1SgSIOTqzDp2aV4GAw-6G-vW8WAwFGfG950";
const QUIZ_SHEET_ID="1ZO6kkJ9GWIh6kmZ_Tmhv8MnBjUoXbRtE3qx30mO3YoI";
const QUIZ_SHEET_NAME="Quiz Results";

function doGet(e){try{if(e&&e.parameter&&e.parameter.action==="leaderboard"){const data={success:true,totalParticipants:leaderboard().length,leaderboard:leaderboard().slice(0,100)};const cb=e.parameter.callback;if(cb&&/^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(cb)){return ContentService.createTextOutput(cb+"("+JSON.stringify(data)+");").setMimeType(ContentService.MimeType.JAVASCRIPT)}return out(data)}return out({success:true,message:"Data Privacy Field Study backend is running."})}catch(err){return out({success:false,error:String(err)})}}

function doPost(e){try{let raw=(e&&e.parameter&&e.parameter.payload)?e.parameter.payload:(e&&e.postData?e.postData.contents:"{}");let p=JSON.parse(raw||"{}");if(p.answers){survey(p.answers);return out({success:true,type:"survey"})}if(p.name!==undefined&&p.roll!==undefined){quiz(p);return out({success:true,type:"quiz"})}throw Error("Invalid payload")}catch(err){return out({success:false,error:String(err)})}}

function questionItems_(form){return form.getItems().filter(function(it){return [FormApp.ItemType.MULTIPLE_CHOICE,FormApp.ItemType.LIST,FormApp.ItemType.CHECKBOX,FormApp.ItemType.TEXT,FormApp.ItemType.PARAGRAPH_TEXT,FormApp.ItemType.SCALE].indexOf(it.getType())!==-1;})}

function norm_(v){return String(v??"").toLowerCase().replace(/[’']/g,"").replace(/[–—-]/g," ").replace(/\s+/g," ").trim()}

function canonical_(q,v){
  const x=norm_(v);
  const maps={
    1:{"18 20":"18–20","21 23":"21–23","24 26":"24–26"},
    4:{"it/cs":"IT / Computer Science"},
    5:{"less than 1":"Less than 1 hour","1 3":"1–3 hours","3 5":"3–5 hours","5 7":"5–7 hours","more than 7":"More than 7 hours"},
    8:{"dont know":"I dont know","don’t know":"I dont know"},
    9:{"phone":"Phone number","aadhaar/pan details":"Aadhaar/PAN details","all of the above":"All of the above"},
    14:{"some accounts private":"Some accounts are private","i dont know how":"I dont know how to change privacy settings"},
    16:{"dont know what 2fa is":"I dont know what 2FA is"},
    20:{"upi/payment fraud":"UPI / Payment Fraud","social media hacking":"Social Media Account Hacking"},
    21:{"share if they claim to be from my bank/company":"Share it if they claim to be from a bank/company"},
    24:{"strong unique passwords":"Using strong and unique passwords","2fa":"Using 2FA","avoid suspicious links":"Avoiding suspicious links","limit information shared":"Limiting personal information shared online","keep devices/apps updated":"Keeping apps and devices updated"},
    25:{"workshops":"Workshops/seminars","social media campaigns":"Social media awareness campaigns","government campaigns":"Government awareness campaigns","videos":"Educational videos"}
  };
  if(maps[q]&&maps[q][x])return maps[q][x];
  return String(v);
}

function match_(choices,v,q){const target=canonical_(q,v);const n=norm_(target);for(let i=0;i<choices.length;i++){if(choices[i]===target)return choices[i]}for(let j=0;j<choices.length;j++){if(norm_(choices[j])===n)return choices[j]}return ""}

function survey(a){
  const f=FormApp.openById(SURVEY_FORM_ID),r=f.createResponse(),items=questionItems_(f);
  if(items.length<25)throw Error("Found only "+items.length+" survey questions; expected 25.");
  for(let i=0;i<25;i++){const q=i+1,v=a["q"+q],it=items[i];if(v===undefined||v===null||v===""||(Array.isArray(v)&&!v.length))continue;const type=it.getType();
    if(type===FormApp.ItemType.MULTIPLE_CHOICE){const choices=it.asMultipleChoiceItem().getChoices().map(c=>c.getValue());const x=match_(choices,Array.isArray(v)?v[0]:v,q);if(x)r.withItemResponse(it.asMultipleChoiceItem().createResponse(x));}
    else if(type===FormApp.ItemType.LIST){const choices=it.asListItem().getChoices().map(c=>c.getValue());const x=match_(choices,Array.isArray(v)?v[0]:v,q);if(x)r.withItemResponse(it.asListItem().createResponse(x));}
    else if(type===FormApp.ItemType.CHECKBOX){const choices=it.asCheckboxItem().getChoices().map(c=>c.getValue());const vals=(Array.isArray(v)?v:[v]).map(x=>match_(choices,x,q)).filter(Boolean);if(vals.length)r.withItemResponse(it.asCheckboxItem().createResponse(vals));}
    else if(type===FormApp.ItemType.TEXT){r.withItemResponse(it.asTextItem().createResponse(String(v)));}
    else if(type===FormApp.ItemType.PARAGRAPH_TEXT){r.withItemResponse(it.asParagraphTextItem().createResponse(String(v)));}
    else if(type===FormApp.ItemType.SCALE){r.withItemResponse(it.asScaleItem().createResponse(Number(v)));}
  }
  r.submit();
}

function quiz(p){const ss=SpreadsheetApp.openById(QUIZ_SHEET_ID),s=ss.getSheetByName(QUIZ_SHEET_NAME)||ss.insertSheet(QUIZ_SHEET_NAME);if(s.getLastRow()===0)s.appendRow(["Timestamp","Name","Roll No.","Score","Total","Percentage","Time (sec)"]);let total=Math.max(1,Number(p.total)||10),score=Math.max(0,Math.min(total,Number(p.score)||0)),pct=Math.max(0,Math.min(100,Number(p.percentage)||Math.round(score/total*100))),time=Math.max(0,Math.round(Number(p.time)||0));s.appendRow([new Date(),String(p.name||"").trim().slice(0,100),String(p.roll||"").trim().slice(0,30),score,total,pct,time])}

function leaderboard(){const s=SpreadsheetApp.openById(QUIZ_SHEET_ID).getSheetByName(QUIZ_SHEET_NAME);if(!s||s.getLastRow()<2)return[];const v=s.getRange(2,1,s.getLastRow()-1,7).getValues();return v.filter(r=>r[1]!=="").map(r=>({name:String(r[1]),score:Number(r[3])||0,total:Number(r[4])||10,percentage:Number(r[5])||0,time:Number(r[6])||0})).sort((a,b)=>b.score-a.score||a.time-b.time)}

function out(x){return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON)}

function testQuizSheet(){const ss=SpreadsheetApp.openById(QUIZ_SHEET_ID);Logger.log(ss.getName());Logger.log(ss.getSheetByName(QUIZ_SHEET_NAME)?"Quiz Results sheet found.":"Quiz Results sheet NOT found.")}
function testSurveyForm(){const f=FormApp.openById(SURVEY_FORM_ID);const q=questionItems_(f);Logger.log("Form: "+f.getTitle());Logger.log("Actual questions found: "+q.length);q.forEach((it,i)=>Logger.log((i+1)+". "+it.getTitle()))}
