**Mining Commands Help**

These commands provide information and calculations related to CCX mining.

**Note:** Mining commands are only available in designated mining channels.

```
| Command                                     | Description                                               |
| ------------------------------------------- | --------------------------------------------------------- |
| .mining help                                | Shows this help message.                                  |
| .mining difficulty                          | Shows the current network difficulty.                     |
| .mining oc                                  | Lists available platforms (nvidia, amd).                  |
| .mining oc <platform>                       | Shows overclocking settings for all GPUs in the platform. |
| .mining oc <platform> <gpu>                 | Shows overclocking settings for a specific GPU.           |
| .mining list <platform>                     | Lists available GPUs for the platform.                    |
| .mining rig <qty0> <gpu0> <qty1> <gpu1> ... | Calculates total hashrate and expected daily reward       |
```

**Examples:**
- `.mining oc amd`
- `.mining list nvidia`
- `.mining oc amd rx6600`
- `.mining rig 2 3060 1 6700XT`
- `.mining rig 3 4060Ti 2 6600`

**Important Notes:**
- **GPU names MUST be concatenated (no spaces)** to preserve argument sequence.
- Use `4060Ti` NOT `4060 Ti`, `RTX4060ti` NOT `RTX 4060 ti`.
- GPU names are case-insensitive.
- Platform is auto-detected: RX* for AMD, others for NVIDIA.
- Calculations use current network hashrate and block reward.