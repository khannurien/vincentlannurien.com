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

Performance:

- TODO: ttft, tk/s
- streaming?
- tools use: jinja
- quantized KV cache
- large context

## Pre-requisites

```sh
sudo apt-get update
sudo apt-get install build-essential git libcurl4-openssl-dev curl libgomp1 cmake
```

## Model download

```sh
curl -LsSf https://hf.co/cli/install.sh | bash
hf download --local-dir models/ --include "*IQ4_XS*.gguf" bartowski/Qwen_Qwen3.6-35B-A3B-GGU
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
./build/bin/llama-server --model models/Qwen_Qwen3.6-35B-A3B-IQ4_XS.gguf -ngl 999 --ctx-size 131072 --cache-type-k q8_0 --cache-type-v q8_0 -fa on --jinja
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
          "name": "Qwen3.6-35B-A3B"
        }
      }
    }
  }
}
```

Start `opencode`, use <kbd>Ctrl</kbd> + <kbd>P</kbd> to select the local model.
