# Tag: debugging

- `INS-260321-2482` When agents fail, the instinct now is 'I gave bad instructions' not 'the AI can't do this' — most failures are configuration problems, not capability limits.
- `INS-260321-D370` Classical robotics systems fail loudly (joint limit hit, object not detected, planner infeasible). VLAs fail silently — producing plausible-looking but wrong trajectories with no mechanism to detect out-of-distribution inputs.
- `INS-260320-96C9` If output quality seems worse, self-reflect on how you're prompting before blaming the model.
- `INS-260320-4773` Run all backend microservices via PM2 so Claude can read individual service logs in real-time without manual copy-pasting.
- `INS-260321-AD95` Since VLAs eliminate the interfaces needed for classical debugging, you must invent new probe methods: attention visualization, camera ablations, counterfactual prompting, and primitive action tests.
