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

## Limits
- Sync is good enough for a party, not sample-perfect. Wi-Fi and speakers add delay. If one laptop sounds early or late, use **Sync nudge** on it.
- Laptops on the same Wi-Fi work best. Some public Wi-Fi blocks devices from talking to each other and strict networks can block WebRTC.
- Anyone who has the room code can join and take control, so share it only with people you trust. Leave the room to close it.
- If the room creator leaves, the room closes for everyone.
- The free PeerJS server can be slow or down at times. To use your own, open the site with `?peerhost=your.server&peerport=443&peerpath=/`.
- Not tested with many laptops. Two to six should be fine.

## Privacy
Camera and microphone never leave your laptop. In a party room, the song the DJ plays is sent to the other laptops in the room, relayed by the room creator's laptop. Songs are not stored on any server. The PeerJS server and the STUN server can see connection details such as IP addresses while laptops find each other.
