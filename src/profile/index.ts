// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// Which product this build is.
//
// THE SINGLE LINE THAT DIVERGES FROM UPSTREAM. Everything else in this repository is
// either the shared engine (src/domain, src/components - merged from upstream) or lives
// beside it in ./gspp. Keeping the divergence to this line is what lets the fork take
// upstream development without conflicts.
export * from "./gspp";
