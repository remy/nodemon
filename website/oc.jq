def getImage:
	. as $_ |
	{
      "206432": "https://user-images.githubusercontent.com/13700/127474039-8ba5ac8c-2095-4984-9309-54ff15e95340.png",
	  "215800": "https://user-images.githubusercontent.com/13700/151881982-04677f3d-e2e1-44ee-a168-258b242b1ef4.svg",
      "327241": "https://user-images.githubusercontent.com/13700/187039696-e2d8cd59-8b4e-438f-a052-69095212427d.png",
      "348965": "https://user-images.githubusercontent.com/13700/199964872-a86bc00b-4273-4251-ae6a-254b0b643d47.jpg",
      "368126": "https://user-images.githubusercontent.com/13700/207157616-8b6d3dd2-e7de-4bbf-86b2-d6ad9fb714fb.png"
    } | (.["\($_.MemberId)"] // $_.image)
;

def getUrl:
	. as $_ | 	{
      "327241": "https://www.noneedtostudy.com/take-my-online-class/",
      "348965": "https://www.testarna.se/casino/utan-svensk-licens/",
      "368126": "https://casinofrog.com/ca/online-casino/new/"
    } | (.["\($_.MemberId)"] // $_.website)
;

def getAlt:
	. as $_ | 	{
      "319480": { description: "casino online stranieri" },
      "321538": { description: "bonus benvenuto scommesse" },
      "327241": { description: "Do My Online Class - NoNeedToStudy.com" },
      "348965": { description: "Testarna" },
      "368126": { description: "New casinos 2023" },
    } | (.["\($_.MemberId)"] // $_) |
	if .description then
		.description
	elif .name then
		.name
	else
		""
	end
;

def tohtml:
	"<a data-id='\(.MemberId)' title='\(getAlt)' href='\(getUrl)'><img alt='\(getAlt)' src='\(getImage)' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>"
;

def tomarkdown:
"<a title='\(.name)' data-id='\(.MemberId)' href='\(getUrl)'><img alt='\(.description)' src='\(getImage)' style='object-fit: contain; float: left; margin:12px' height='120' width='120'></a>";

. + [{
  isActive: true,
  MemberId: "padlet",
  image: "https://images.opencollective.com/padlet/320fa3e/logo/256.png",
  createdAt: "2022-02-09 12:00:00",
  website: "https://padlet.com"
}, {
  isActive: false,
  website: "https://snyk.co/nodemon",
  MemberId: "snyk",
  image: "https://user-images.githubusercontent.com/13700/165926338-ae9458ab-89c5-4c97-bc9b-86b5049576bf.png",
  createdAt: "2022-04-29 12:00:00"
}, {
  # manually added
  isActive: true,
  MemberId: "Empire Srls (double)",
  image: true,
  createdAt: "2022-08-09 12:00:00",
  website: "https://casinosicuri.info/",
  description: "casino online sicuri",
  image: "https://user-images.githubusercontent.com/13700/183862257-d13855b6-68ad-4c06-a474-af1d6efcc430.jpg"
}] |

def markdown: $markdown;

def render:	if markdown then tomarkdown else tohtml end;

sort_by(.createdAt) | map(select(.isActive == true and getImage) | render) | if markdown then .[] else join("\n") end
