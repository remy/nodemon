def getImage:
	. as $_ |
	{
      "206432": "https://user-images.githubusercontent.com/13700/127474039-8ba5ac8c-2095-4984-9309-54ff15e95340.png",
	  "215800": "https://user-images.githubusercontent.com/13700/151881982-04677f3d-e2e1-44ee-a168-258b242b1ef4.svg",
      "327241": "https://user-images.githubusercontent.com/13700/187039696-e2d8cd59-8b4e-438f-a052-69095212427d.png",
      "348965": "https://user-images.githubusercontent.com/13700/199964872-a86bc00b-4273-4251-ae6a-254b0b643d47.jpg",
      "368126": "https://user-images.githubusercontent.com/13700/207157616-8b6d3dd2-e7de-4bbf-86b2-d6ad9fb714fb.png",
      "471843": "https://github-production-user-asset-6210df.s3.amazonaws.com/13700/277616726-33b554c8-24e0-4570-b8ed-293fb2ab2448.jpg",
      "501897": "https://github-production-user-asset-6210df.s3.amazonaws.com/13700/286696172-747dca05-a1e8-4d93-a9e9-95054d1566df.png"
    } | (.["\($_.MemberId)"] // $_.image)
;

def getUrl:
	. as $_ | 	{
      "327241": "https://www.noneedtostudy.com/take-my-online-class/",
      "348965": "https://www.testarna.se/casino/utan-svensk-licens/",
      "368126": "https://casinofrog.com/ca/online-casino/new/",
      "468969": "https://bestnongamstopcasinos.net/",
      "501897": "https://buycheapestfollowers.com/buy-telegram-channel-members",
    } | (.["\($_.MemberId)"] // $_.website)
;

def getAlt:
	. as $_ | 	{
      "319480": { description: "casino online stranieri" },
      "321538": { description: "bonus benvenuto scommesse" },
      "327241": { description: "Do My Online Class - NoNeedToStudy.com" },
      "348965": { description: "Testarna" },
      "368126": { description: "New casinos 2023" },
      "471843": { description: "Aviators" },
      "501897": { description: "Buy Telegram Members" },
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
  # manually added
  isActive: true,
  MemberId: "Online Casinos Australia",
  image: true,
  createdAt: "2023-09-17 12:00:00",
  website: "https://online-casinosaustralia.com/",
  description: "Online Casinos Australia",
  image: "https://github-production-user-asset-6210df.s3.amazonaws.com/13700/268531585-c2b4e482-0409-4664-9aa2-95a62b0d606d.png"
},{
  # manually added
  isActive: true,
  MemberId: "slotozilla",
  image: true,
  createdAt: "2023-11-29 12:00:00",
  website: "https://www.slotozilla.com/au/free-spins",
  description: "free spins no deposit",
  image: "https://github-production-user-asset-6210df.s3.amazonaws.com/13700/286693953-c68112b6-ebe6-49fd-af6a-5c810a54908d.jpg"
}] |

def markdown: $markdown;

def render:	if markdown then tomarkdown else tohtml end;

sort_by(.createdAt) | map(select(.isActive == true and getImage) | render) | if markdown then .[] else join("\n") end
