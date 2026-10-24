/* NoxyMusic · site settings. Fill in RELAY so party mode can connect laptops on strict networks, such as phone hotspots and many home connections.
   Easiest: create a free account at a TURN provider (for example Metered), copy its "credentials" link and paste it into link below.
   Or fill urls, username and credential by hand. Note: this file is public on a static site, so use keys you can rotate. See docs/PARTY.md. */
export const RELAY={
 link:"",       // for example "https://YOURAPP.metered.live/api/v1/turn/credentials?apiKey=YOURKEY"
 urls:"",       // or by hand: "turn:YOUR.HOST:80, turn:YOUR.HOST:443?transport=tcp, turns:YOUR.HOST:443?transport=tcp"
 username:"",
 credential:""
};
