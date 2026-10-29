# Party mode

Connect laptops with a room code so they all play the same songs, lights and effects, even when friends are in different cities. One laptop plays at a time: whoever presses play takes over, and the other laptops stop and follow.

## Use it
1. On the laptop that will start the party, open the **Party** tab, type your name and press **Create a room**. You get a 4-character code.
2. Friends open the same site, go to **Party**, type the code and press **Join**. Or press **Copy invite link** or **WhatsApp** and send it: the link fills in the code.
3. Upload songs in the **DJ** tab on any laptop and press play. The other laptops fetch the song once, then play it in sync.
4. To switch DJs, press play, upload a song or start a transition on another laptop. That laptop becomes the DJ and the previous one stops and follows. **Take control** does the same without touching the decks.
5. On a following laptop, a line under the status shows how close it is to the DJ right now: **In sync (12 ms)**, **Adjusting** or **Catching up**.
6. The bar under the stage shows whether you are in a room. The list in the Party tab shows each friend's delay (good, ok or slow) and whether they are linked directly or through a relay.

## What is shared
- Songs on both decks, play and pause, position, speed, volume and the crossfader
- The light show: the DJ's laptop sends every beat, scene change, flash and blackout, so all screens show the same show
- Sound effect pads from the DJ's laptop
- Optional small videos (see below)

Everything else stays local on each laptop: instrument, key, camera, face characters, recording and the master volume.

## Friends in different places
Laptops anywhere on the internet can join the same room. Most connect directly. On many phone networks and some home connections a direct link is impossible, so a **relay** (a TURN server) passes the traffic through the middle.

- **Built in.** When a direct link fails and you have not set a relay of your own, NoxyMusic uses the free shared Metered Open Relay. It needs no sign-up. You can switch it off under **Connection help**.
- **Your own relay (most reliable).** Make a free account at a TURN provider such as Metered or Cloudflare, copy the "credentials" link (or the addresses, user name and password) into **Connection help** and press **Save relay**. A relay of your own replaces the shared one. Everyone in the room should add it.
- **Check my connection.** The **Test** button asks your browser what it can reach and says in plain words if direct links and the relay work on this network. Run it on each laptop before the party.
- **Dropped connections.** If a laptop loses its connection (for example when a phone network switches), it reconnects by itself up to four times. The list shows who is slow.

For a whole site, put a relay link or details in `js/config.js` so nobody has to type them. That file is public, so use keys you can rotate. For one-off use you can open the site with `?turn=turn:host:443&turnuser=NAME&turnpass=PASSWORD`, `?turnlink=https://...`, `?shared=0` to turn the shared relay off, or `&relayonly=1` to force everything through the relay when testing.

## Video (optional)
In the Party tab, under **Video**, turn on **Share my video** to show a small live picture of your stage view (hands, filters and faces) or of the camera only. It is off until you turn it on, it stops when you leave the room, and the **Show friends' videos** switch hides everyone else's. Videos are small and low quality on purpose (about 250 kbit/s each, up to 8 at once) so they do not slow the music. Click a tile to make it bigger. Videos go through the room creator's laptop, so anyone in the room can see them.

## Staying in time
No message can travel instantly, so a laptop in another city always learns about the DJ's press of play a few hundredths of a second late. NoxyMusic does not wait for that. Every laptop plays its own copy of the song and keeps checking it against a shared clock:

- The DJ's laptop reports its position about eight times a second, stamped with the shared time. A follower works out where the DJ is *now*, not where the DJ was when the message left, so the network delay cancels out.
- If a follower is a little ahead or behind, it plays 1 to 5 percent slower or faster until it lines up. The pitch stays the same, and there is no jump or click. It only jumps when it is more than 0.2 seconds off, and then waits 1.5 seconds before it can jump again.
- Each laptop tells the others how long its speakers take to make sound (when the browser knows), and a laptop with slower speakers plays slightly ahead, so everyone hears the beat at the same moment.
- The shared clock is measured with a rolling set of recent pings, so one slow reply cannot throw it off.

In a simulated bad network (30 to 200 ms delays, lost messages, slow audio start-up and laptop clocks that run a little fast or slow), followers stayed within about 10 ms of the DJ, compared with about 115 ms for the older method. Real networks and speakers are less tidy, so use the **In sync** readout on each laptop to check it.

What it cannot see: Bluetooth speakers and some TVs add 100 to 250 ms that the browser cannot measure, and a network that is much slower one way than the other makes the clock off by half the difference. Use **Sync nudge** (up to 500 ms earlier or later) on that laptop. The light show is drawn when each beat arrives, so it can trail the music by the network delay.

## How it works
- Laptops connect with WebRTC. A free public PeerJS server only introduces them. The laptop that created the room is the hub and relays messages, songs and videos.
- The DJ's laptop describes the whole room eight times a second. Followers copy it using the shared clock (see Staying in time).
- Songs travel in 32 KB chunks, once per song per laptop, up to 60 MB.
- Each time the DJ changes, the room starts a new epoch. Messages from an old epoch are ignored, so two laptops can't fight over the decks.
- The shared relay login is made in your browser: the user name is an expiry time a few hours ahead and the password is its HMAC-SHA1 with the shared secret, the way coturn "shared secret" servers expect.

## Limits
- Sync is tight, but not sample-perfect, and it depends on the network and speakers. If one laptop still sounds early or late, use **Sync nudge** on it.
- A relay carries the music, and the shared relay is used by many people, so it can be slow or busy. A relay of your own is better. Direct links do not use a relay.
- The hub sends every song and video, so choose the laptop with the best internet to create the room. If the creator leaves, the room closes for everyone.
- Anyone who has the room code can join and take control, so share it only with people you trust. Leave the room to close it.
- The free PeerJS server can be slow or down at times. To use your own, open the site with `?peerhost=your.server&peerport=443&peerpath=/`.
- Not tested with many laptops. Two to six should be fine.

## Privacy
Camera and microphone never leave your laptop unless you turn on **Share my video**. In a party room, the song the DJ plays is sent to the other laptops in the room, relayed by the room creator's laptop. Songs are not stored on any server. The PeerJS server and the STUN servers can see connection details such as IP addresses while laptops find each other. If a relay is used (the shared one or your own), it carries the room's traffic between laptops that cannot connect directly. That traffic is encrypted by WebRTC, but the relay provider can see who connected and how much data moved.
