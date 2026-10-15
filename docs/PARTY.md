# Party mode

Connect laptops with a room code so they all play the same songs, lights and effects. One laptop plays at a time: whoever presses play takes over, and the other laptops stop and follow.

## Use it
1. On the laptop that will start the party, open the **Party** tab and press **Create room**. You get a 4-character code.
2. On the other laptops, open the same site, go to **Party**, type the code and press **Join**. Or press **Copy invite link** and send it: the link fills in the code for you.
3. Upload songs in the **DJ** tab on any laptop and press play. The other laptops fetch the song once, then play it in sync.
4. To switch DJs, press play, upload a song or start a transition on another laptop. That laptop becomes the DJ and the previous one stops and follows. **Take control** does the same without touching the decks.

## What is shared
- Songs on both decks, play and pause, position, speed, volume and the crossfader
- The light show: the DJ's laptop sends every beat, scene change, flash and blackout, so all screens show the same show
- Sound effect pads from the DJ's laptop

Everything else stays local on each laptop: instrument, key, camera, face characters, recording and the master volume.

## How it works
- Laptops connect directly to each other with WebRTC. A free public PeerJS server is only used to introduce them. The laptop that created the room acts as the room's hub and relays messages and songs.
- The DJ's laptop describes the whole room four times a second. Followers copy it, using a shared clock measured with pings, and only seek when they drift by more than 0.15 seconds.
- Songs travel in 32 KB chunks, once per song per laptop, up to 60 MB.
- Each time the DJ changes, the room starts a new epoch. Messages from an old epoch are ignored, so two laptops can't fight over the decks.

## Laptops on different networks
Laptops anywhere on the internet can join the same room with the code. Most connect directly. On some networks (many schools, offices and mobile carriers) a direct link is impossible, and those laptops need a **relay** (a TURN server) that passes the music through the middle.

1. Get free TURN details from a provider, for example Metered Open Relay or Cloudflare Calls: one or more addresses such as `turn:host:443?transport=tcp`, a user name and a password.
2. In the **Party** tab, open **Connection help**, paste them and press **Save relay**. They are kept in this browser only.
3. Create or join the room as usual. The laptop list shows **direct** or **via relay** next to each laptop, so you can see how it connected.
4. Everyone should add the same details. If a laptop cannot join, add the relay on that laptop first.

For a whole site, put the details in `js/config.js` so nobody has to type them. That file is public, so use a key you can rotate. For one-off use you can also open the site with `?turn=turn:host:443&turnuser=NAME&turnpass=PASSWORD`, and add `&relayonly=1` to force everything through the relay when testing.

## Limits
- Sync is good enough for a party, not sample-perfect. Wi-Fi and speakers add delay. If one laptop sounds early or late, use **Sync nudge** on it.
- Laptops on the same Wi-Fi work best. Some public Wi-Fi blocks devices from talking to each other and strict networks can block WebRTC. Add a relay (above) for those.
- A relay carries the music, so free relay plans with a monthly data limit can run out at a big party. Direct links do not use the relay.
- Anyone who has the room code can join and take control, so share it only with people you trust. Leave the room to close it.
- If the room creator leaves, the room closes for everyone.
- The free PeerJS server can be slow or down at times. To use your own, open the site with `?peerhost=your.server&peerport=443&peerpath=/`.
- Not tested with many laptops. Two to six should be fine.

## Privacy
Camera and microphone never leave your laptop. In a party room, the song the DJ plays is sent to the other laptops in the room, relayed by the room creator's laptop. Songs are not stored on any server. The PeerJS server and the STUN server can see connection details such as IP addresses while laptops find each other. If you use a relay, it carries the room's traffic between laptops that cannot connect directly. That traffic is encrypted by WebRTC, but the relay provider can see who connected and how much data moved.
