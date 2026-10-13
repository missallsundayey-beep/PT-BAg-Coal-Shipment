// Synthetic regression inputs derived from the written rules, not operational reports.
function ship(name, events, {jetty='1&2', contract='A7-21', summary=''}={}) {
  return `JETTY ${jetty}\nMV ${name} (EBP ${contract} Laycan 20 Sep - 19 Oct 2026)\n${summary ? '('+summary+')\n' : ''}${events}`;
}
function report(body, {date='08 Oktober 2026', clock='09:00'}={}) {
  return `${date}${clock ? ' @ '+clock+' LT' : ''}\n${body}`;
}
const loading='07:00 LT / 07th : TA Muara Berau\n08:00 LT / 07th : Commence Loading\n09:00 LT / 08th : Complete Loading';
const discharge='07:00 LT / 07th : TA Tanjung Jati\n08:00 LT / 07th : Commence Disch\n08:00 LT / 08th : Complete Disch';
const shifting='07:00 LT / 07th : TA Tanjung Jati\n08:00 LT / 07th : All Fast at Jetty 3&4\n08:00 LT / 08th : POB Shifting to Jetty 1&2\n10:00 LT / 08th : All Fast at Jetty 1&2';
const cases=[
 {name:'before CL',text:report(ship('ALPHA',loading)),time:'08:59',status:'LOADING'},
 {name:'exact CL',text:report(ship('ALPHA',loading)),time:'09:00',status:'COMPLETE LOADING'},
 {name:'after CL',text:report(ship('ALPHA',loading)),time:'09:01',status:'WAITING P.CLEARANCE'},
 {name:'next day after CL',text:report(ship('ALPHA',loading),{date:'09 Oktober 2026',clock:'07:00'}),status:'WAITING P.CLEARANCE'},
 {name:'ETD does not end waiting',text:report(ship('ALPHA',loading+'\n09:30 LT / 08th : ETD Muara Berau'),{clock:'12:00'}),status:'WAITING P.CLEARANCE'},
 {name:'TD ends waiting',text:report(ship('ALPHA',loading+'\n09:30 LT / 08th : TD Muara Berau\n08:00 LT / 10th : ETA Tanjung Jati'),{clock:'12:00'}),status:'SAILING',port:'Tanjung Jati'},
 {name:'POB unberthing is not departure',text:report(ship('ALPHA',loading+'\n09:30 LT / 08th : POB Unberthing'),{clock:'12:00'}),status:'UNBERTHING PROCESS',port:'Muara Berau'},
 {name:'POB ETD is not departure',text:report(ship('ALPHA',loading+'\n09:30 LT / 08th : POB ETD Tanjung Jati to Weda'),{clock:'12:00'}),status:'UNBERTHING PROCESS',port:'Muara Berau'},
 {name:'POB berthing retains explicit context',text:report(ship('ALPHA',loading+'\n09:30 LT / 08th : POB Berthing'),{clock:'12:00'}),status:'BERTHED'},
 {name:'complete discharge does not become clearance',text:report(ship('ALPHA',discharge),{clock:'12:00'}),status:'COMPLETE DISCHARGE'},
 {name:'actual arrival display',text:report(ship('ALPHA','08:00 LT / 08th : TA Bontang')),status:'DROP ANCHOR',port:'Bontang'},
 {name:'summary arrival retains ETA',text:report(ship('ALPHA','07:00 LT / 07th : TD Tanjung Jati\n10:00 LT / 08th : ETA Bontang',{summary:'Arrival Bontang'})),status:'DROP ANCHOR',port:'Bontang'},
 {name:'expired ETA alone is not arrival',text:report(ship('ALPHA','07:00 LT / 07th : TD Tanjung Jati\n08:00 LT / 08th : ETA Bontang')),status:'SAILING'},
 {name:'estimated loading and berthing do not happen automatically',text:report(ship('ALPHA','07:00 LT / 07th : TA Bontang\n08:00 LT / 07th : Est Complete Loading\n08:30 LT / 07th : ETB at Bontang')),status:'DROP ANCHOR'},
 {name:'external actual Pemancingan',text:report(ship('ALPHA','08:00 LT / 08th : TA Tanjung Pemancingan')),status:'DROP ANCHOR',band:'external',port:'Tanjung Pemancingan'},
 {name:'external sailing Pemancingan',text:report(ship('ALPHA','08:00 LT / 08th : TD Tanjung Jati to Tanjung Pemancingan\n10:00 LT / 10th : ETA Tanjung Pemancingan')),status:'SAILING',band:'external'},
 {name:'external summary without time',text:report(ship('ALPHA','',{summary:'Arrival Tanjung Pemancingan'})),status:'DROP ANCHOR',band:'external',port:'Tanjung Pemancingan'},
 {name:'external plan retains actual port',text:report(ship('ALPHA',loading+'\n09:30 LT / 08th : ETD Muara Berau to Tanjung Pemancingan'),{clock:'12:00'}),status:'WAITING P.CLEARANCE',band:'top',port:'Muara Berau'},
 {name:'shifting before all fast',text:report(ship('ALPHA',shifting,{jetty:'3&4'})),status:'SHIFTING',jetty:'3-4'},
 {name:'shifting after all fast overrides section jetty',text:report(ship('ALPHA',shifting,{jetty:'3&4'}),{clock:'11:00'}),status:'BERTHED',jetty:'1-2'},
 {name:'AM CL before range end',text:report(ship('ALPHA',loading.replace('09:00 LT / 08th','AM / 08th')),{clock:'11:58'}),status:'LOADING'},
 {name:'AM CL at range end',text:report(ship('ALPHA',loading.replace('09:00 LT / 08th','AM / 08th')),{clock:'11:59'}),status:'COMPLETE LOADING'},
 {name:'AM CL after range end',text:report(ship('ALPHA',loading.replace('09:00 LT / 08th','AM / 08th')),{clock:'12:00'}),status:'WAITING P.CLEARANCE'},
 {name:'CL without clock conservative range',text:report(ship('ALPHA',loading.replace('09:00 LT / 08th','— / 08th')),{clock:'12:00'}),status:'LOADING'},
 {name:'CL without clock next day',text:report(ship('ALPHA',loading.replace('09:00 LT / 08th','— / 08th')),{date:'09 Oktober 2026',clock:'12:00'}),status:'WAITING P.CLEARANCE'},
 {name:'CL without date does not invent timestamp',text:report(ship('ALPHA',loading.replace('09:00 LT / 08th : Complete Loading','Complete Loading')),{clock:'12:00'}),status:'COMPLETE LOADING'},
 {name:'reported complete loading no exact time',text:report(ship('ALPHA','',{summary:'Complete Loading at Muara Berau'}),{clock:'12:00'}),status:'COMPLETE LOADING',port:'Muara Berau'},
 {name:'empty report snapshot is not computer time',text:ship('ALPHA',loading),status:'STATUS UNKNOWN'},
 {name:'date only no snapshot clock',text:report(ship('ALPHA',loading),{clock:''}),status:'STATUS UNKNOWN'},
 {name:'date only explicit snapshot clock',text:report(ship('ALPHA',loading),{clock:''}),time:'09:01',status:'WAITING P.CLEARANCE'},
 {name:'stop discharge remains stopped',text:report(ship('ALPHA',discharge.replace('08:00 LT / 08th : Complete Disch','08:00 LT / 08th : Stop Discharging\n08:30 LT / 08th : Est Continue Discharging'))),status:'DISCHARGE STOPPED'},
 {name:'expired estimated CL does not finish actual loading',text:report(ship('ALPHA',loading.replace('Complete Loading','Est Complete Loading')),{clock:'12:00'}),status:'LOADING'},
 {name:'arrival at port summary keeps real port name',text:report(ship('ALPHA','',{summary:'Arrival at Tanjung Pemancingan'})),status:'DROP ANCHOR',band:'external',port:'Tanjung Pemancingan'},
 {name:'plain drop anchor summary without a clock',text:report('JETTY 1&2\nMV ALPHA (EBP A7-21 Laycan 20 Sep - 19 Oct 2026)\nDrop Anchor at Weda'),status:'DROP ANCHOR',band:'external',port:'Weda'},
 {name:'future undetermined CL does not override current actual loading',text:report(ship('ALPHA',loading.replace('09:00 LT / 08th','— / 09th'),{summary:'Complete Loading at Muara Berau'}),{clock:'12:00'}),status:'LOADING'},
 {name:'actual continue discharge resumes',text:report(ship('ALPHA',discharge.replace('08:00 LT / 08th : Complete Disch','08:00 LT / 08th : Stop Discharging\n08:30 LT / 08th : Continue Discharging'))),status:'DISCHARGING'}
];
module.exports={ship,report,loading,discharge,shifting,cases};

const layoutCases=[
 {name:'chronological DA and loading stay ordered',text:report(ship('LOAD','06:00 LT / 08th : TA Muara Berau\n08:00 LT / 08th : Commence Loading')+'\n'+ship('ANCHOR','06:00 LT / 08th : TA Muara Berau\n07:00 LT / 08th : Drop Anchor'),{clock:'10:00'}),order:['Anchor','Load']},
 {name:'equal time port priorities and stable ties',text:report(ship('WAIT',loading.replace('09:00 LT / 08th','08:00 LT / 08th'))+'\n'+ship('ANCHOR','08:00 LT / 08th : TA Muara Berau')+'\n'+ship('LOAD B','07:00 LT / 08th : TA Muara Berau\n08:00 LT / 08th : Commence Loading')+'\n'+ship('LOAD A','07:00 LT / 08th : TA Muara Berau\n08:00 LT / 08th : Commence Loading'),{clock:'10:00'}),order:['Load B','Load A','Anchor','Wait']},
 {name:'external group and port beside jetty',text:report(ship('EXTERNAL A','08:00 LT / 08th : TA Tanjung Pemancingan')+'\n'+ship('EXTERNAL B','08:00 LT / 08th : TA Weda')+'\n'+ship('LOAD','07:00 LT / 08th : TA Muara Pantai\n08:00 LT / 08th : Commence Loading')+'\n'+ship('ANCHOR','08:00 LT / 08th : TA Muara Pantai')+'\n'+ship('JETTY','07:00 LT / 08th : TA Tanjung Jati\n08:00 LT / 08th : All Fast at Jetty 3&4',{jetty:'3&4'}),{clock:'10:00'})},
 {name:'seven external ships retain all panels',text:report(Array.from({length:7},(_,i)=>ship('EXTERNAL '+i,'08:00 LT / 08th : TA Tanjung Pemancingan')).join('\n'))}
];
module.exports.layoutCases=layoutCases;
