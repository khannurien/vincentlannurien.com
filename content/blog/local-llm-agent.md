---
draft: true
hide_title: false

title: "Local LLM Agent"
date: 2026-04-20T11:59:08Z

tags:
  - "llm"
  - "linux"
---

## Overview

Hardware:

- 1x Ryzen 7 3700x 
- 32 GB DDR4
- 1x NVIDIA RTX 4070 Super (12 GB)

Features:

- Vision (`mmproj`)
- Tools use (`jinja`)

Optimizations :

- MoE model, maximum GPU usage
- Quantized KV cache for large context

## Pre-requisites

```sh
sudo apt-get update
sudo apt-get install build-essential git libcurl4-openssl-dev curl libgomp1 cmake
```

## Model download

TODO: HF_TOKEN

```sh
curl -LsSf https://hf.co/cli/install.sh | bash
# TODO: Main model
export HF_TOKEN=TODO && \
  hf download --local-dir models/ --include "*IQ4_XS*.gguf" bartowski/Qwen_Qwen3.6-35B-A3B-GGUF
# TODO: Vision model
export HF_TOKEN=TODO && \
  hf download --local-dir models/ --include "*mmproj*bf16*.gguf" bartowski/Qwen_Qwen3.6-35B-A3B-GGUF
```

## Llama.cpp

```sh
# Download ik_llama.cpp
git clone git@github.com:ikawrakow/ik_llama.cpp.git
cd ik_llama.cpp

# Build ik_llama.cpp with CUDA support
cmake -B build -DGGML_NATIVE=ON -DGGML_CUDA=ON
cmake --build build --config Release -j$(nproc)

# Run the model
# TODO: Options details
./build/bin/llama-server \
  --model models/Qwen3.6-35B-A3B-UD-IQ4_XS.gguf \
  --mmproj models/mmproj-Qwen3.6-35B-A3B-BF16.gguf \
  -ngl 999 \
  --ctx-size 98304 \
  --cache-type-k q8_0 \
  --cache-type-v q8_0 \
  -fa on \
  --jinja
```

TODO: `llama-bench`

Real-world agentic tasks expected performance: prompt processing @ ~100-200 tk/s, text generation @ ~7.5 tk/s. Forget about interactive tasks :-)

Recursive exploration of a directory tree to find and summarize heterogeneous/unstructured PDF files located at arbitrary depth in the tree:

```
prompt eval time =    2279.39 ms /   322 tokens (    7.08 ms per token,   141.27 tokens per second)
       eval time =   54034.10 ms /   384 tokens (  140.71 ms per token,     7.11 tokens per second)
      total time =   56313.49 ms /   706 tokens

prompt eval time =    2279.39 ms /   322 tokens (    7.08 ms per token,   141.27 tokens per second)
       eval time =   54034.10 ms /   384 tokens (  140.71 ms per token,     7.11 tokens per second)
      total time =   56313.49 ms /   706 tokens

prompt eval time =    5341.49 ms /   391 tokens (   13.66 ms per token,    73.20 tokens per second)
       eval time =   37373.45 ms /   275 tokens (  135.90 ms per token,     7.36 tokens per second)
      total time =   42714.94 ms /   666 tokens

prompt eval time =  101418.50 ms / 24541 tokens (    4.13 ms per token,   241.98 tokens per second)
       eval time =   11200.17 ms /    86 tokens (  130.23 ms per token,     7.68 tokens per second)
      total time =  112618.68 ms / 24627 tokens

prompt eval time =    5720.40 ms /  1316 tokens (    4.35 ms per token,   230.05 tokens per second)
       eval time =    9054.11 ms /    73 tokens (  124.03 ms per token,     8.06 tokens per second)
      total time =   14774.51 ms /  1389 tokens

prompt eval time =   28682.33 ms /  7074 tokens (    4.05 ms per token,   246.63 tokens per second)
       eval time =   13261.89 ms /   106 tokens (  125.11 ms per token,     7.99 tokens per second)
      total time =   41944.22 ms /  7180 tokens

prompt eval time =    9068.96 ms /  2109 tokens (    4.30 ms per token,   232.55 tokens per second)
       eval time =    5989.99 ms /    51 tokens (  117.45 ms per token,     8.51 tokens per second)
      total time =   15058.94 ms /  2160 tokens
```

## OpenCode

```sh
curl -fsSL https://opencode.ai/install | bash
```

Configuration file: `~/.config/opencode/opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "llama-local": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "llama.cpp (local)",
      "options": {
        "baseURL": "http://127.0.0.1:8080/v1"
      },
      "models": {
        "qwen3.6-35b": {
          "name": "Qwen3.6-35B-A3B",
          "modalities": {
            "input": ["text", "image"],
            "output": ["text"]
          }
        }
      }
    }
  }
}
```

In a terminal, start `opencode`, use <kbd>Ctrl</kbd> + <kbd>P</kbd> to select the local model.

This OpenCode shortcut conflicts with VS Code's command palette. Open `keybindings.json` (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>, then type "shortcuts json") and add those:

```json
  {
    "key": "ctrl+p",
    "command": "workbench.action.quickOpen",
    "when": "!terminalFocus",
  },
  {
    "key": "ctrl+p",
    "command": "-workbench.action.quickOpen",
  },
```
