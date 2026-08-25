# Third-party software notices

Aurelian Tessera++ (Mozilla Public License 2.0, © Aurelian-Risk) is distributed as one
self-contained HTML file that inlines the open-source libraries listed below. Their
copyright and permission notices are reproduced here, as their licences require.

Combining them with MPL-covered files into one distributed file is what MPL-2.0 section 3.3
calls a Larger Work, and is permitted: the MPL-covered files stay under the MPL, the rest
under the licences below.

Data sources, the BSI ruleset and trademark attributions are in [`NOTICE.md`](NOTICE.md);
the name and the mark are in [`TRADEMARK.md`](TRADEMARK.md).

## Bundled at build time, inlined into `dist/index.html`

| Package | Version | Licence | Copyright |
| --- | --- | --- | --- |
| `react` | 19.2.8 | MIT | Copyright (c) Meta Platforms, Inc. and affiliates. |
| `react-dom` | 19.2.8 | MIT | Copyright (c) Meta Platforms, Inc. and affiliates. |
| `zustand` | 5.0.14 | MIT | Copyright (c) 2019 Paul Henschel |
| `js-yaml` | 4.3.0 | MIT | Copyright (C) 2011-2015 by Vitaly Puzrin |
| `pdfjs-dist` | 4.10.38 | Apache-2.0 | Copyright Mozilla Foundation and contributors |

`pdfjs-dist` is Mozilla's PDF.js. It is bundled so that Word and PDF import extracts text on
the device, with no network and no CDN. It runs on the main thread rather than in a web
worker, because a worker cannot be started from a `file://` URL.

### MIT

> Permission is hereby granted, free of charge, to any person obtaining a copy of this
> software and associated documentation files (the "Software"), to deal in the Software
> without restriction, including without limitation the rights to use, copy, modify, merge,
> publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
> to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or
> substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
> INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
> PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
> FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
> OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
> DEALINGS IN THE SOFTWARE.

### ISC

> Permission to use, copy, modify, and/or distribute this software for any purpose with or
> without fee is hereby granted, provided that the above copyright notice and this
> permission notice appear in all copies.
>
> THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO
> THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT
> SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR
> ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
> OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE
> USE OR PERFORMANCE OF THIS SOFTWARE.

### Apache-2.0

`pdfjs-dist` is licensed under the Apache License, Version 2.0. The full text is at
<https://www.apache.org/licenses/LICENSE-2.0> and ships in the package as `LICENSE`. The
file is used unmodified.

## Loaded at runtime from a CDN, not bundled

One optional feature reaches the network, and only when the user asks for it.

| Package | Version | Licence | Copyright |
| --- | --- | --- | --- |
| `@huggingface/transformers` | 3.3.3 | Apache-2.0 | Copyright Hugging Face and contributors |

It is imported from `https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3` when the
user starts the embedding model, and the model weights are fetched from Hugging Face and
kept in IndexedDB. Neither is part of the distributed file. Without that press nothing is
fetched, and the application runs in full.

Two things are deliberately absent: no telemetry, no error reporting, no automatic update
check; and no font, stylesheet, script or image is fetched to render the page.
