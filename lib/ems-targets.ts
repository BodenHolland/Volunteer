// Cities >50k pop in the 37 US states where the ambulance-cost dataset
// currently has zero or near-zero verified provider rate schedules.
// Source: US Census Bureau population estimates; gap-state list pulled
// from the ambulance-cost project's `state_coverage` table.
//
// Each entry is a volunteer research target. provider_name is intentionally
// blank — finding the agency that serves the city is part of the work.
export type EmsTarget = { provider_name: string; city: string; state: string };

const CITIES: Array<[string, string]> = [
  // AL
  ["Birmingham","AL"],["Huntsville","AL"],["Mobile","AL"],["Montgomery","AL"],["Tuscaloosa","AL"],["Hoover","AL"],["Auburn","AL"],["Dothan","AL"],["Decatur","AL"],["Madison","AL"],
  // AR
  ["Little Rock","AR"],["Fayetteville","AR"],["Fort Smith","AR"],["Springdale","AR"],["Jonesboro","AR"],["Rogers","AR"],["Conway","AR"],["North Little Rock","AR"],["Bentonville","AR"],
  // DE
  ["Wilmington","DE"],["Dover","DE"],["Newark","DE"],
  // GA
  ["Atlanta","GA"],["Augusta","GA"],["Columbus","GA"],["Macon","GA"],["Savannah","GA"],["Athens","GA"],["Sandy Springs","GA"],["South Fulton","GA"],["Roswell","GA"],["Johns Creek","GA"],["Warner Robins","GA"],["Albany","GA"],["Alpharetta","GA"],["Marietta","GA"],["Stonecrest","GA"],["Smyrna","GA"],["Brookhaven","GA"],["Valdosta","GA"],["Dunwoody","GA"],["Rome","GA"],["East Point","GA"],["Milton","GA"],["Gainesville","GA"],["Hinesville","GA"],["Peachtree Corners","GA"],["Newnan","GA"],["Douglasville","GA"],["Kennesaw","GA"],["LaGrange","GA"],["Statesboro","GA"],["Tucker","GA"],["Lawrenceville","GA"],
  // IA
  ["Des Moines","IA"],["Cedar Rapids","IA"],["Davenport","IA"],["Sioux City","IA"],["Iowa City","IA"],["Waterloo","IA"],["Ames","IA"],["West Des Moines","IA"],["Council Bluffs","IA"],["Ankeny","IA"],["Dubuque","IA"],["Urbandale","IA"],["Cedar Falls","IA"],
  // KS
  ["Wichita","KS"],["Overland Park","KS"],["Kansas City","KS"],["Olathe","KS"],["Topeka","KS"],["Lawrence","KS"],["Shawnee","KS"],["Manhattan","KS"],["Lenexa","KS"],["Salina","KS"],["Hutchinson","KS"],["Leavenworth","KS"],
  // LA
  ["New Orleans","LA"],["Baton Rouge","LA"],["Shreveport","LA"],["Metairie","LA"],["Lafayette","LA"],["Lake Charles","LA"],["Kenner","LA"],["Bossier City","LA"],["Monroe","LA"],["Alexandria","LA"],["Houma","LA"],["Marrero","LA"],["New Iberia","LA"],
  // MI
  ["Detroit","MI"],["Grand Rapids","MI"],["Warren","MI"],["Sterling Heights","MI"],["Ann Arbor","MI"],["Lansing","MI"],["Flint","MI"],["Dearborn","MI"],["Livonia","MI"],["Troy","MI"],["Westland","MI"],["Farmington Hills","MI"],["Kalamazoo","MI"],["Wyoming","MI"],["Southfield","MI"],["Rochester Hills","MI"],["Taylor","MI"],["Pontiac","MI"],["St. Clair Shores","MI"],["Royal Oak","MI"],["Novi","MI"],["Dearborn Heights","MI"],["Battle Creek","MI"],["Saginaw","MI"],["Kentwood","MI"],["East Lansing","MI"],["Roseville","MI"],["Portage","MI"],["Midland","MI"],["Lincoln Park","MI"],
  // MN
  ["Minneapolis","MN"],["Saint Paul","MN"],["Rochester","MN"],["Duluth","MN"],["Bloomington","MN"],["Brooklyn Park","MN"],["Plymouth","MN"],["Maple Grove","MN"],["Woodbury","MN"],["Saint Cloud","MN"],["Eagan","MN"],["Eden Prairie","MN"],["Coon Rapids","MN"],["Burnsville","MN"],["Minnetonka","MN"],["Apple Valley","MN"],["Edina","MN"],["Lakeville","MN"],["Blaine","MN"],["Mankato","MN"],["St. Louis Park","MN"],["Inver Grove Heights","MN"],["Maplewood","MN"],["Roseville","MN"],
  // MS
  ["Jackson","MS"],["Gulfport","MS"],["Southaven","MS"],["Biloxi","MS"],["Hattiesburg","MS"],["Olive Branch","MS"],["Tupelo","MS"],["Meridian","MS"],
  // MO
  ["Kansas City","MO"],["St. Louis","MO"],["Springfield","MO"],["Independence","MO"],["Columbia","MO"],["Lee's Summit","MO"],["O'Fallon","MO"],["St. Joseph","MO"],["St. Charles","MO"],["St. Peters","MO"],["Florissant","MO"],["Joplin","MO"],["Chesterfield","MO"],["Jefferson City","MO"],["Cape Girardeau","MO"],["Wildwood","MO"],["Blue Springs","MO"],["Wentzville","MO"],
  // MT
  ["Billings","MT"],["Missoula","MT"],["Great Falls","MT"],["Bozeman","MT"],["Butte","MT"],["Helena","MT"],["Kalispell","MT"],
  // ND
  ["Fargo","ND"],["Bismarck","ND"],["Grand Forks","ND"],["Minot","ND"],["West Fargo","ND"],["Mandan","ND"],
  // NH
  ["Manchester","NH"],["Nashua","NH"],["Concord","NH"],["Dover","NH"],["Rochester","NH"],
  // NJ
  ["Newark","NJ"],["Jersey City","NJ"],["Paterson","NJ"],["Lakewood","NJ"],["Elizabeth","NJ"],["Edison","NJ"],["Woodbridge","NJ"],["Toms River","NJ"],["Hamilton","NJ"],["Trenton","NJ"],["Clifton","NJ"],["Camden","NJ"],["Brick","NJ"],["Cherry Hill","NJ"],["Passaic","NJ"],["Union City","NJ"],["Bayonne","NJ"],["Middletown","NJ"],["Old Bridge","NJ"],["East Orange","NJ"],["North Bergen","NJ"],["Vineland","NJ"],["Wayne","NJ"],["New Brunswick","NJ"],["Irvington","NJ"],["Piscataway","NJ"],["Howell","NJ"],["Hoboken","NJ"],["West New York","NJ"],["Plainfield","NJ"],
  // SC
  ["Charleston","SC"],["Columbia","SC"],["North Charleston","SC"],["Mount Pleasant","SC"],["Rock Hill","SC"],["Greenville","SC"],["Summerville","SC"],["Goose Creek","SC"],["Hilton Head Island","SC"],["Florence","SC"],["Sumter","SC"],["Spartanburg","SC"],["Aiken","SC"],["Anderson","SC"],["Myrtle Beach","SC"],
  // SD
  ["Sioux Falls","SD"],["Rapid City","SD"],["Aberdeen","SD"],["Brookings","SD"],
  // TN
  ["Nashville","TN"],["Memphis","TN"],["Knoxville","TN"],["Chattanooga","TN"],["Clarksville","TN"],["Murfreesboro","TN"],["Franklin","TN"],["Johnson City","TN"],["Jackson","TN"],["Hendersonville","TN"],["Kingsport","TN"],["Smyrna","TN"],["Cleveland","TN"],["Brentwood","TN"],["Collierville","TN"],["Bartlett","TN"],["Mount Juliet","TN"],
  // VT
  ["Burlington","VT"],["South Burlington","VT"],["Essex","VT"],["Rutland","VT"],
  // WV
  ["Charleston","WV"],["Huntington","WV"],["Morgantown","WV"],["Parkersburg","WV"],["Wheeling","WV"],
  // WY
  ["Cheyenne","WY"],["Casper","WY"],["Laramie","WY"],["Gillette","WY"],
  // ME
  ["Portland","ME"],["Lewiston","ME"],["Bangor","ME"],["South Portland","ME"],["Auburn","ME"],
  // RI
  ["Providence","RI"],["Warwick","RI"],["Cranston","RI"],["Pawtucket","RI"],["East Providence","RI"],["Woonsocket","RI"],["Coventry","RI"],["North Providence","RI"],
  // AK
  ["Anchorage","AK"],["Fairbanks","AK"],["Juneau","AK"],["Wasilla","AK"],
  // DC
  ["Washington","DC"],
  // HI
  ["Honolulu","HI"],["Pearl City","HI"],["Hilo","HI"],["Kailua","HI"],["Waipahu","HI"],["Kaneohe","HI"],
  // ID
  ["Boise","ID"],["Meridian","ID"],["Nampa","ID"],["Idaho Falls","ID"],["Pocatello","ID"],["Caldwell","ID"],["Coeur d'Alene","ID"],["Twin Falls","ID"],["Lewiston","ID"],["Post Falls","ID"],
  // IN
  ["Indianapolis","IN"],["Fort Wayne","IN"],["Evansville","IN"],["South Bend","IN"],["Carmel","IN"],["Fishers","IN"],["Bloomington","IN"],["Hammond","IN"],["Gary","IN"],["Lafayette","IN"],["Noblesville","IN"],["Greenwood","IN"],["Anderson","IN"],["Elkhart","IN"],["Mishawaka","IN"],["Lawrence","IN"],["Jeffersonville","IN"],["Columbus","IN"],["Westfield","IN"],["New Albany","IN"],["Portage","IN"],["Richmond","IN"],["Muncie","IN"],["Terre Haute","IN"],
  // KY
  ["Louisville","KY"],["Lexington","KY"],["Bowling Green","KY"],["Owensboro","KY"],["Covington","KY"],["Hopkinsville","KY"],["Richmond","KY"],["Florence","KY"],["Henderson","KY"],["Elizabethtown","KY"],["Georgetown","KY"],["Nicholasville","KY"],
  // NV
  ["Las Vegas","NV"],["Henderson","NV"],["Reno","NV"],["North Las Vegas","NV"],["Enterprise","NV"],["Spring Valley","NV"],["Sunrise Manor","NV"],["Paradise","NV"],["Sparks","NV"],["Carson City","NV"],
  // NY (excluding NYC — FDNY EMS already in dataset)
  ["Buffalo","NY"],["Yonkers","NY"],["Rochester","NY"],["Syracuse","NY"],["Albany","NY"],["New Rochelle","NY"],["Mount Vernon","NY"],["Schenectady","NY"],["Utica","NY"],["Hempstead","NY"],["Brentwood","NY"],["White Plains","NY"],["Levittown","NY"],["Troy","NY"],["Niagara Falls","NY"],["Binghamton","NY"],["West Babylon","NY"],["Hicksville","NY"],["Elmont","NY"],
  // OH
  ["Columbus","OH"],["Cleveland","OH"],["Cincinnati","OH"],["Toledo","OH"],["Akron","OH"],["Dayton","OH"],["Parma","OH"],["Canton","OH"],["Youngstown","OH"],["Lorain","OH"],["Hamilton","OH"],["Springfield","OH"],["Kettering","OH"],["Elyria","OH"],["Lakewood","OH"],["Cuyahoga Falls","OH"],["Middletown","OH"],["Newark","OH"],["Mansfield","OH"],["Mentor","OH"],["Beavercreek","OH"],["Cleveland Heights","OH"],["Strongsville","OH"],["Fairfield","OH"],["Dublin","OH"],["Westerville","OH"],["Findlay","OH"],
  // OK
  ["Oklahoma City","OK"],["Tulsa","OK"],["Norman","OK"],["Broken Arrow","OK"],["Lawton","OK"],["Edmond","OK"],["Moore","OK"],["Midwest City","OK"],["Enid","OK"],["Stillwater","OK"],["Muskogee","OK"],["Bartlesville","OK"],["Owasso","OK"],["Shawnee","OK"],
  // PA (Pittsburgh kept as known target via legacy seed if desired)
  ["Philadelphia","PA"],["Pittsburgh","PA"],["Allentown","PA"],["Erie","PA"],["Reading","PA"],["Scranton","PA"],["Bethlehem","PA"],["Lancaster","PA"],["Harrisburg","PA"],["Altoona","PA"],["York","PA"],["Wilkes-Barre","PA"],["Chester","PA"],["State College","PA"],["Bensalem","PA"],["Norristown","PA"],["Lebanon","PA"],
  // UT
  ["Salt Lake City","UT"],["West Valley City","UT"],["West Jordan","UT"],["Provo","UT"],["Orem","UT"],["Sandy","UT"],["St. George","UT"],["Ogden","UT"],["Layton","UT"],["South Jordan","UT"],["Lehi","UT"],["Millcreek","UT"],["Taylorsville","UT"],["Logan","UT"],["Murray","UT"],["Bountiful","UT"],
  // CO
  ["Denver","CO"],["Colorado Springs","CO"],["Aurora","CO"],["Fort Collins","CO"],["Lakewood","CO"],["Thornton","CO"],["Arvada","CO"],["Westminster","CO"],["Pueblo","CO"],["Centennial","CO"],["Boulder","CO"],["Greeley","CO"],["Longmont","CO"],["Loveland","CO"],["Castle Rock","CO"],["Broomfield","CO"],["Grand Junction","CO"],["Commerce City","CO"],["Parker","CO"],
  // MA
  ["Boston","MA"],["Worcester","MA"],["Springfield","MA"],["Cambridge","MA"],["Lowell","MA"],["Brockton","MA"],["Quincy","MA"],["Lynn","MA"],["New Bedford","MA"],["Fall River","MA"],["Newton","MA"],["Lawrence","MA"],["Somerville","MA"],["Framingham","MA"],["Haverhill","MA"],["Waltham","MA"],["Malden","MA"],["Brookline","MA"],["Plymouth","MA"],["Medford","MA"],["Taunton","MA"],
  // NE
  ["Omaha","NE"],["Lincoln","NE"],["Bellevue","NE"],["Grand Island","NE"],["Kearney","NE"],["Fremont","NE"],["Hastings","NE"],["Norfolk","NE"],["North Platte","NE"],["Papillion","NE"],
];

export const EMS_TARGETS: EmsTarget[] = CITIES.map(([city, state]) => ({
  provider_name: "",
  city,
  state,
}));
