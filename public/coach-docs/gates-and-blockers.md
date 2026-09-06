# Gates & Blockers — ScriptFlora

## Brief confirmation gate
**The Brief must be confirmed before skills can run.** This is intentional.

Why: Confirmed Brief = locked production intent. Every regeneration and skill run reads from the same Brief, so the output stays aligned even if you regenerate individual nodes later.

How to confirm: Fill in at minimum the Title and Objective, then click "Confirm Brief & unlock pipeline" on the Brief node. Required fields show a red error list if missing.

## Character images gate
**Character images must be locked before video generation for that character.**

Why: Video models (especially Act-Two for performance shots) require a visual reference. Without a locked reference image the model has no anchor for the character's appearance.

How to unlock: Upload or generate a reference image for a character, then click the Lock icon on that character card in the Character Bible node.

## Auteur skill requires locked Character Bible
The Auteur skill reads character data and injects it into every generation stage. Running it without a locked character produces generic output — the skill will refuse to run if no locked character with a reference image exists.

## Runway credits gate
**Video generation requires Runway credits (seconds remaining).**

If you have zero Runway seconds remaining, the Generate Shot node will show a credits warning. Options:
- Top up Runway credits
- Upgrade your plan (Creator and Studio plans include Runway seconds)
- Use the Generate Shot node in simulation mode (no Runway key = simulated result for testing)

## Director credits gate
If you're using platform-provided Director credits (not Login with ChatGPT), the Coach will warn when they run low. Options:
- Connect your own ChatGPT subscription via Login with ChatGPT (free tier of the platform)
- Upgrade to Creator or Studio for more platform credits

## Checkpoint gate
Checkpoints are deliberate human gates. You cannot continue batch generation until the minimum number of Result nodes are approved AND you click through the checkpoint.

Why: Long-form generation without human review at regular intervals leads to cascading continuity failures. Checkpoints exist to keep the Director in control.

## HyperFrames requires a Sequence
You cannot package with HyperFrames until you have a Sequence node with at least one approved clip.

Why: HyperFrames composes clips from an approved Timeline/Sequence. No clips = nothing to package.

## Skills Studio publish gate
A skill must pass a Test Run before it can be published. Test Run uses an isolated sandbox and never touches real project data.
