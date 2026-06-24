import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import type { StateFormData } from "./types";

type Config = { state: string; formId: string; title: string; agency: string; intro: string[]; instructions: string[]; activityLabel?: string; twoPage?: boolean; weekly?: boolean; includeAddress?: boolean; includePhone?: boolean; caseLabel?: string; certification: string[] };

/** Shared hand-drawn state-form canvas.  It deliberately uses no template asset so
 * every builder remains safe in the Cloudflare Workers runtime. */
export async function buildOfficialStateForm(data: StateFormData, c: Config): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${c.formId} - ${c.title}`); doc.setProducer("Tended");
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const W = 612, H = 792, L = 36, R = 576;
  const page = doc.addPage([W, H]);
  const T = (top: number) => H - top;
  const text = (p: typeof page, value: string, x: number, top: number, size = 10, font: PDFFont = regular) => p.drawText(value, { x, y: T(top), size, font });
  const line = (p: typeof page, x1: number, top: number, x2: number) => p.drawLine({ start: { x: x1, y: T(top) }, end: { x: x2, y: T(top) }, thickness: .65, color: rgb(.15,.15,.15) });
  const band = (p: typeof page, label: string, top: number) => { p.drawRectangle({ x:L, y:T(top+18), width:R-L, height:18, color:rgb(.13,.12,.12) }); p.drawText(label,{x:L+7,y:T(top+13),size:10,font:bold,color:rgb(1,1,1)}); };
  const field = (p: typeof page, label: string, value: string, top: number, x=L, end=R) => { text(p,label,x,top,9,bold); const start=x+Math.min(180,bold.widthOfTextAtSize(label,9)+8); line(p,start,top+3,end); if(value) text(p,value,start+3,top,9); };
  const header = (p: typeof page) => { text(p,c.agency,L,41,10,bold); text(p,c.title,L,72,17,bold); text(p,c.formId,R-bold.widthOfTextAtSize(c.formId,9),41,9,regular); line(p,L,82,R); };
  header(page);
  let y=102;
  for(const s of c.intro) { text(page,s,L,y,9.2); y+=12; }
  if(c.twoPage) {
    band(page,"PART 1. PARTICIPANT INFORMATION",y+8); y+=38;
  } else { band(page,"SECTION I. PARTICIPANT INFORMATION",y+8); y+=38; }
  field(page,"Participant name",data.participantName,y); y+=22;
  field(page,c.caseLabel ?? "Case number",data.caseNumber ?? "",y); y+=22;
  field(page,"Address",data.participantAddress.filter(Boolean).join(", "),y); y+=22;
  if(c.includePhone) { field(page,"Phone number",data.participantPhone ?? "",y); y+=22; }
  if(c.twoPage) {
    text(page,"Participant authorization",L,y+8,10,bold); text(page,"I authorize release of requested volunteer/community-service program information to the agency.",L,y+22,8.5);
    line(page,L,y+46,310); line(page,380,y+46,R); text(page,"Participant signature",L,y+57,8); text(page,"Date",380,y+57,8);
    const p2=doc.addPage([W,H]); header(p2); y=104; band(p2,"PART 2. VOLUNTEER / COMMUNITY SERVICE PROGRAM STAFF",y); y+=38;
  } else { band(page,"SECTION II. VOLUNTEER / COMMUNITY SERVICE INFORMATION",y+8); y+=38; }
  const p = c.twoPage ? doc.getPages()[1] : page;
  field(p,"Organization name",data.orgName,y); y+=22;
  if(c.includeAddress !== false) { field(p,"Organization address",data.orgAddress.filter(Boolean).join(", "),y); y+=22; }
  field(p,"Supervisor / representative",data.representativeName,y); y+=22;
  if(c.includePhone !== false) { field(p,"Organization phone",data.orgPhone,y); y+=22; }
  field(p,"Reporting month",data.month,y); y+=24;
  text(p,c.activityLabel ?? "Volunteer/community service activity",L,y,9,bold); line(p,L,y+15,R); text(p,data.positionDescription ?? "Volunteer civic service",L+3,y+11,9); y+=28;
  // Monthly schedule keeps the official forms' blank weekly grid while safely
  // deriving a weekly average from measured, approved monthly hours.
  p.drawRectangle({x:L,y:T(y+76),width:R-L,height:76,borderWidth:.7,borderColor:rgb(.15,.15,.15)});
  const cols=[L,L+105,L+205,L+305,L+405,R]; for(const x of cols.slice(1,-1)) p.drawLine({start:{x,y:T(y)},end:{x,y:T(y+76)},thickness:.6});
  for(let i=1;i<4;i++) line(p,L,y+i*19,R);
  text(p,"Month / year",L+5,y+13,8,bold); text(p,"Week 1",L+112,y+13,8,bold); text(p,"Week 2",L+212,y+13,8,bold); text(p,"Week 3",L+312,y+13,8,bold); text(p,"Total hours",L+413,y+13,8,bold);
  const avg=(Math.round((data.hours/4)*10)/10).toString(); text(p,data.month,L+5,y+32,9); text(p,avg,L+125,y+32,9); text(p,avg,L+225,y+32,9); text(p,avg,L+325,y+32,9); text(p,String(data.hours),L+430,y+32,10,bold); y+=96;
  band(p,"AGENCY / PROGRAM CERTIFICATION",y); y+=31;
  for(const s of c.certification) { text(p,s,L,y,8.2); y+=11; }
  line(p,L,y+20,280); line(p,300,y+20,432); line(p,450,y+20,R);
  if(data.signatureName) text(p,data.signatureName,L+5,y+16,12,italic); if(data.dateSigned) text(p,data.dateSigned,452,y+16,9);
  text(p,"Signature of supervisor",L,y+32,8); text(p,"Printed name / title",300,y+32,8); text(p,"Date",450,y+32,8);
  text(p,`${c.formId}  |  ${c.state} state SNAP work-requirement verification`,L,766,7.5);
  for(const s of c.instructions) text(p,s,L,778,7.3);
  return doc.save();
}
