// Node Compatibility Layer: Mapping Old Airport Graph Node IDs to Airport Graph V2
export interface NodeMappingInfo {
  oldId: string | null;
  v2Id: string | null;
  status: 'active' | 'substituted' | 'deprecated';
  targetCoords: { x: number; y: number };
  deviationFromTracePx: number;
  note: string;
}

export const NODE_COMPATIBILITY_MAP: Record<string, NodeMappingInfo> = {
  "RWY07L_THR": {
    "oldId": "RWY07L_THR",
    "v2Id": "RWY07L_THR",
    "status": "active",
    "targetCoords": {
      "x": 57,
      "y": 433
    },
    "deviationFromTracePx": 0.0,
    "note": "Khóa theo line_01 pt 0"
  },
  "R1_W4": {
    "oldId": "R1_W4",
    "v2Id": "R1_W4",
    "status": "active",
    "targetCoords": {
      "x": 224,
      "y": 360
    },
    "deviationFromTracePx": 0.0,
    "note": "Giao điểm line_01 pt 1 & line_05"
  },
  "R1_MID_V2": {
    "oldId": null,
    "v2Id": "R1_MID_V2",
    "status": "active",
    "targetCoords": {
      "x": 422,
      "y": 271
    },
    "deviationFromTracePx": 0.0,
    "note": "Khóa theo line_01 pt 2"
  },
  "R1_NS_ENTRY_V2": {
    "oldId": null,
    "v2Id": "R1_NS_ENTRY_V2",
    "status": "active",
    "targetCoords": {
      "x": 596,
      "y": 194
    },
    "deviationFromTracePx": 0.0,
    "note": "Khóa theo line_01 pt 3"
  },
  "R1_NS": {
    "oldId": "R1_NS",
    "v2Id": "R1_NS",
    "status": "active",
    "targetCoords": {
      "x": 767,
      "y": 121
    },
    "deviationFromTracePx": 0.0,
    "note": "Giao điểm line_01 pt 4 & line_12"
  },
  "RWY25R_THR": {
    "oldId": "RWY25R_THR",
    "v2Id": "RWY25R_THR",
    "status": "active",
    "targetCoords": {
      "x": 926,
      "y": 51
    },
    "deviationFromTracePx": 0.0,
    "note": "Khóa theo line_01 pt 5"
  },
  "RWY07R_THR": {
    "oldId": "RWY07R_THR",
    "v2Id": "RWY07R_THR",
    "status": "active",
    "targetCoords": {
      "x": 55,
      "y": 635
    },
    "deviationFromTracePx": 0.0,
    "note": "Khóa theo line_02 pt 0"
  },
  "R2_W11_ENTRY_V2": {
    "oldId": null,
    "v2Id": "R2_W11_ENTRY_V2",
    "status": "active",
    "targetCoords": {
      "x": 86,
      "y": 621
    },
    "deviationFromTracePx": 0.0,
    "note": "Giao điểm line_02 pt 1 & line_06"
  },
  "R2_W7": {
    "oldId": "R2_W7",
    "v2Id": "R2_W7",
    "status": "active",
    "targetCoords": {
      "x": 224,
      "y": 556
    },
    "deviationFromTracePx": 0.0,
    "note": "Giao điểm line_02 pt 2 & line_05"
  },
  "R2_W6_EXIT_V2": {
    "oldId": null,
    "v2Id": "R2_W6_EXIT_V2",
    "status": "active",
    "targetCoords": {
      "x": 241,
      "y": 550
    },
    "deviationFromTracePx": 0.0,
    "note": "Khóa theo line_02 pt 3"
  },
  "R2_W5": {
    "oldId": "R2_W5",
    "v2Id": "R2_W5",
    "status": "active",
    "targetCoords": {
      "x": 446,
      "y": 459
    },
    "deviationFromTracePx": 0.0,
    "note": "Giao điểm line_02 pt 4 & line_07"
  },
  "R2_W3": {
    "oldId": "R2_W3",
    "v2Id": "R2_W3",
    "status": "active",
    "targetCoords": {
      "x": 630,
      "y": 377
    },
    "deviationFromTracePx": 0.0,
    "note": "Giao điểm line_02 pt 5 & line_10"
  },
  "R2_NS2_V2": {
    "oldId": null,
    "v2Id": "R2_NS2_V2",
    "status": "active",
    "targetCoords": {
      "x": 816,
      "y": 296
    },
    "deviationFromTracePx": 0.0,
    "note": "Giao điểm line_02 pt 6 & line_12/14"
  },
  "R2_E1_EXIT_V2": {
    "oldId": null,
    "v2Id": "R2_E1_EXIT_V2",
    "status": "active",
    "targetCoords": {
      "x": 914,
      "y": 253
    },
    "deviationFromTracePx": 0.0,
    "note": "Giao điểm line_02 pt 7 & line_15/17"
  },
  "R2_E4": {
    "oldId": "R2_E4",
    "v2Id": "R2_E4",
    "status": "active",
    "targetCoords": {
      "x": 952,
      "y": 236
    },
    "deviationFromTracePx": 0.0,
    "note": "Giao điểm line_02 pt 8 & line_16/19"
  },
  "RWY25L_THR": {
    "oldId": "RWY25L_THR",
    "v2Id": "RWY25L_THR",
    "status": "active",
    "targetCoords": {
      "x": 1129,
      "y": 160
    },
    "deviationFromTracePx": 0.0,
    "note": "Khóa theo line_02 pt 9"
  },
  "H07L": {
    "oldId": "H07L",
    "v2Id": "H07L",
    "status": "active",
    "targetCoords": {
      "x": 64,
      "y": 431
    },
    "deviationFromTracePx": 0.0,
    "note": "line_04 pt 0"
  },
  "T10": {
    "oldId": "T10",
    "v2Id": "T10",
    "status": "active",
    "targetCoords": {
      "x": 65,
      "y": 478
    },
    "deviationFromTracePx": 0.0,
    "note": "line_04 pt 2"
  },
  "T13": {
    "oldId": "T13",
    "v2Id": "T13",
    "status": "active",
    "targetCoords": {
      "x": 66,
      "y": 515
    },
    "deviationFromTracePx": 0.0,
    "note": "line_04 pt 3"
  },
  "T12": {
    "oldId": "T12",
    "v2Id": "T12",
    "status": "active",
    "targetCoords": {
      "x": 65,
      "y": 559
    },
    "deviationFromTracePx": 0.0,
    "note": "line_04 pt 4"
  },
  "T11": {
    "oldId": "T11",
    "v2Id": "T11",
    "status": "active",
    "targetCoords": {
      "x": 69,
      "y": 621
    },
    "deviationFromTracePx": 0.0,
    "note": "line_04 pt 6"
  },
  "T32": {
    "oldId": "T32",
    "v2Id": "T32",
    "status": "active",
    "targetCoords": {
      "x": 67,
      "y": 634
    },
    "deviationFromTracePx": 0.0,
    "note": "line_03 pt 0"
  },
  "T1": {
    "oldId": "T1",
    "v2Id": "T1",
    "status": "active",
    "targetCoords": {
      "x": 81,
      "y": 680
    },
    "deviationFromTracePx": 0.0,
    "note": "line_03 pt 2"
  },
  "T2": {
    "oldId": "T2",
    "v2Id": "T2",
    "status": "active",
    "targetCoords": {
      "x": 106,
      "y": 711
    },
    "deviationFromTracePx": 0.0,
    "note": "line_03 pt 4"
  },
  "X1": {
    "oldId": "X1",
    "v2Id": "X1",
    "status": "active",
    "targetCoords": {
      "x": 124,
      "y": 716
    },
    "deviationFromTracePx": 0.0,
    "note": "line_03 pt 5"
  },
  "T3": {
    "oldId": "T3",
    "v2Id": "T3",
    "status": "active",
    "targetCoords": {
      "x": 174,
      "y": 696
    },
    "deviationFromTracePx": 0.0,
    "note": "line_03 pt 6"
  },
  "T4": {
    "oldId": "T4",
    "v2Id": "T4",
    "status": "active",
    "targetCoords": {
      "x": 326,
      "y": 628
    },
    "deviationFromTracePx": 0.0,
    "note": "line_03 pt 7"
  },
  "T5": {
    "oldId": "T5",
    "v2Id": "T5",
    "status": "active",
    "targetCoords": {
      "x": 420,
      "y": 587
    },
    "deviationFromTracePx": 0.0,
    "note": "line_03 pt 8"
  },
  "W11_ENTRY_MID_V2": {
    "oldId": null,
    "v2Id": "W11_ENTRY_MID_V2",
    "status": "active",
    "targetCoords": {
      "x": 102,
      "y": 670
    },
    "deviationFromTracePx": 0.0,
    "note": "line_06 pt 2"
  },
  "T21": {
    "oldId": "T21",
    "v2Id": "T21",
    "status": "active",
    "targetCoords": {
      "x": 224,
      "y": 380
    },
    "deviationFromTracePx": 0.0,
    "note": "line_05 pt 1"
  },
  "T20": {
    "oldId": "T20",
    "v2Id": "T20",
    "status": "active",
    "targetCoords": {
      "x": 219,
      "y": 422
    },
    "deviationFromTracePx": 0.0,
    "note": "line_05 pt 2"
  },
  "T19": {
    "oldId": "T19",
    "v2Id": "T19",
    "status": "active",
    "targetCoords": {
      "x": 213,
      "y": 461
    },
    "deviationFromTracePx": 0.0,
    "note": "line_05 pt 3"
  },
  "HS16": {
    "oldId": "HS16",
    "v2Id": "HS16",
    "status": "active",
    "targetCoords": {
      "x": 210,
      "y": 478
    },
    "deviationFromTracePx": 0.0,
    "note": "line_05 pt 4"
  },
  "T18": {
    "oldId": "T18",
    "v2Id": "T18",
    "status": "active",
    "targetCoords": {
      "x": 215,
      "y": 503
    },
    "deviationFromTracePx": 0.0,
    "note": "line_05 pt 5"
  },
  "H07R": {
    "oldId": "H07R",
    "v2Id": "H07R",
    "status": "active",
    "targetCoords": {
      "x": 228,
      "y": 541
    },
    "deviationFromTracePx": 0.0,
    "note": "line_05 pt 6"
  },
  "T14": {
    "oldId": "T14",
    "v2Id": "T14",
    "status": "active",
    "targetCoords": {
      "x": 242,
      "y": 578
    },
    "deviationFromTracePx": 0.0,
    "note": "line_05 pt 8"
  },
  "T15": {
    "oldId": "T15",
    "v2Id": "T15",
    "status": "active",
    "targetCoords": {
      "x": 255,
      "y": 603
    },
    "deviationFromTracePx": 0.0,
    "note": "line_05 pt 9"
  },
  "T16": {
    "oldId": "T16",
    "v2Id": "T16",
    "status": "active",
    "targetCoords": {
      "x": 265,
      "y": 614
    },
    "deviationFromTracePx": 0.0,
    "note": "line_05 pt 10"
  },
  "T17": {
    "oldId": "T17",
    "v2Id": "T17",
    "status": "active",
    "targetCoords": {
      "x": 321,
      "y": 630
    },
    "deviationFromTracePx": 0.0,
    "note": "line_05 pt 11"
  },
  "T22": {
    "oldId": "T22",
    "v2Id": "T22",
    "status": "active",
    "targetCoords": {
      "x": 441,
      "y": 480
    },
    "deviationFromTracePx": 0.0,
    "note": "line_07 pt 1"
  },
  "T23": {
    "oldId": "T23",
    "v2Id": "T23",
    "status": "active",
    "targetCoords": {
      "x": 436,
      "y": 506
    },
    "deviationFromTracePx": 0.0,
    "note": "line_07 pt 2"
  },
  "T24": {
    "oldId": "T24",
    "v2Id": "T24",
    "status": "active",
    "targetCoords": {
      "x": 434,
      "y": 531
    },
    "deviationFromTracePx": 0.0,
    "note": "line_07 pt 3"
  },
  "T25": {
    "oldId": "T25",
    "v2Id": "T25",
    "status": "active",
    "targetCoords": {
      "x": 437,
      "y": 548
    },
    "deviationFromTracePx": 0.0,
    "note": "line_07 pt 4"
  },
  "T26": {
    "oldId": "T26",
    "v2Id": "T26",
    "status": "active",
    "targetCoords": {
      "x": 429,
      "y": 584
    },
    "deviationFromTracePx": 0.0,
    "note": "line_07 pt 6"
  },
  "T30": {
    "oldId": "T30",
    "v2Id": "T30",
    "status": "active",
    "targetCoords": {
      "x": 438,
      "y": 552
    },
    "deviationFromTracePx": 0.0,
    "note": "line_08 pt 0"
  },
  "T31": {
    "oldId": "T31",
    "v2Id": "T31",
    "status": "active",
    "targetCoords": {
      "x": 459,
      "y": 568
    },
    "deviationFromTracePx": 0.0,
    "note": "line_08 pt 1"
  },
  "T27": {
    "oldId": "T27",
    "v2Id": "T27",
    "status": "active",
    "targetCoords": {
      "x": 455,
      "y": 651
    },
    "deviationFromTracePx": 0.0,
    "note": "line_09 pt 1"
  },
  "T28": {
    "oldId": "T28",
    "v2Id": "T28",
    "status": "active",
    "targetCoords": {
      "x": 628,
      "y": 588
    },
    "deviationFromTracePx": 0.0,
    "note": "line_09 pt 3"
  },
  "M5_APRON_JUNCTION_V2": {
    "oldId": null,
    "v2Id": "M5_APRON_JUNCTION_V2",
    "status": "active",
    "targetCoords": {
      "x": 633,
      "y": 577
    },
    "deviationFromTracePx": 0.0,
    "note": "line_09 pt 4"
  },
  "T29": {
    "oldId": "T29",
    "v2Id": "T29",
    "status": "active",
    "targetCoords": {
      "x": 647,
      "y": 390
    },
    "deviationFromTracePx": 0.0,
    "note": "line_10 pt 1"
  },
  "HS5": {
    "oldId": "HS5",
    "v2Id": "HS5",
    "status": "active",
    "targetCoords": {
      "x": 706,
      "y": 436
    },
    "deviationFromTracePx": 0.0,
    "note": "line_11 pt 0"
  },
  "T41": {
    "oldId": "T41",
    "v2Id": "T41",
    "status": "active",
    "targetCoords": {
      "x": 725,
      "y": 447
    },
    "deviationFromTracePx": 0.0,
    "note": "line_10 pt 2"
  },
  "HS4": {
    "oldId": "HS4",
    "v2Id": "HS4",
    "status": "active",
    "targetCoords": {
      "x": 731,
      "y": 455
    },
    "deviationFromTracePx": 0.0,
    "note": "line_10 pt 3"
  },
  "T59": {
    "oldId": "T59",
    "v2Id": "T59",
    "status": "active",
    "targetCoords": {
      "x": 834,
      "y": 114
    },
    "deviationFromTracePx": 0.0,
    "note": "line_12 pt 1"
  },
  "T58": {
    "oldId": "T58",
    "v2Id": "T58",
    "status": "active",
    "targetCoords": {
      "x": 832,
      "y": 153
    },
    "deviationFromTracePx": 0.0,
    "note": "line_12 pt 2"
  },
  "T33": {
    "oldId": "T33",
    "v2Id": "T33",
    "status": "active",
    "targetCoords": {
      "x": 825,
      "y": 199
    },
    "deviationFromTracePx": 0.0,
    "note": "line_12 pt 3"
  },
  "HS11": {
    "oldId": "HS11",
    "v2Id": "HS11",
    "status": "active",
    "targetCoords": {
      "x": 822,
      "y": 238
    },
    "deviationFromTracePx": 0.0,
    "note": "line_12 pt 4"
  },
  "NS1_MID_JUNCTION_V2": {
    "oldId": null,
    "v2Id": "NS1_MID_JUNCTION_V2",
    "status": "active",
    "targetCoords": {
      "x": 817,
      "y": 288
    },
    "deviationFromTracePx": 0.0,
    "note": "line_12 pt 6"
  },
  "HS17": {
    "oldId": "HS17",
    "v2Id": "HS17",
    "status": "active",
    "targetCoords": {
      "x": 811,
      "y": 321
    },
    "deviationFromTracePx": 0.0,
    "note": "line_14 pt 1"
  },
  "T54": {
    "oldId": "T54",
    "v2Id": "T54",
    "status": "active",
    "targetCoords": {
      "x": 809,
      "y": 367
    },
    "deviationFromTracePx": 0.0,
    "note": "line_14 pt 2"
  },
  "T55": {
    "oldId": "T55",
    "v2Id": "T55",
    "status": "active",
    "targetCoords": {
      "x": 807,
      "y": 401
    },
    "deviationFromTracePx": 0.0,
    "note": "line_14 pt 3"
  },
  "HS3": {
    "oldId": "HS3",
    "v2Id": "HS3",
    "status": "active",
    "targetCoords": {
      "x": 808,
      "y": 423
    },
    "deviationFromTracePx": 0.0,
    "note": "line_14 pt 4"
  },
  "T56": {
    "oldId": "T56",
    "v2Id": "T56",
    "status": "active",
    "targetCoords": {
      "x": 802,
      "y": 447
    },
    "deviationFromTracePx": 0.0,
    "note": "line_14 pt 5"
  },
  "T57": {
    "oldId": "T57",
    "v2Id": "T57",
    "status": "active",
    "targetCoords": {
      "x": 795,
      "y": 544
    },
    "deviationFromTracePx": 0.0,
    "note": "line_14 pt 7"
  },
  "T69": {
    "oldId": "T69",
    "v2Id": "T69",
    "status": "active",
    "targetCoords": {
      "x": 786,
      "y": 630
    },
    "deviationFromTracePx": 0.0,
    "note": "line_14 pt 8"
  },
  "NS1_SOUTH_END_V2": {
    "oldId": null,
    "v2Id": "NS1_SOUTH_END_V2",
    "status": "active",
    "targetCoords": {
      "x": 775,
      "y": 764
    },
    "deviationFromTracePx": 0.0,
    "note": "line_14 pt 10"
  },
  "H25R": {
    "oldId": "H25R",
    "v2Id": "H25R",
    "status": "active",
    "targetCoords": {
      "x": 930,
      "y": 78
    },
    "deviationFromTracePx": 0.0,
    "note": "line_15 pt 1"
  },
  "T60": {
    "oldId": "T60",
    "v2Id": "T60",
    "status": "active",
    "targetCoords": {
      "x": 924,
      "y": 140
    },
    "deviationFromTracePx": 0.0,
    "note": "line_15 pt 2"
  },
  "T61": {
    "oldId": "T61",
    "v2Id": "T61",
    "status": "active",
    "targetCoords": {
      "x": 920,
      "y": 207
    },
    "deviationFromTracePx": 0.0,
    "note": "line_15 pt 3"
  },
  "HS12": {
    "oldId": "HS12",
    "v2Id": "HS12",
    "status": "active",
    "targetCoords": {
      "x": 934,
      "y": 227
    },
    "deviationFromTracePx": 0.0,
    "note": "line_16 pt 1"
  },
  "T62": {
    "oldId": "T62",
    "v2Id": "T62",
    "status": "active",
    "targetCoords": {
      "x": 917,
      "y": 254
    },
    "deviationFromTracePx": 0.0,
    "note": "line_17 pt 0"
  },
  "T63": {
    "oldId": "T63",
    "v2Id": "T63",
    "status": "active",
    "targetCoords": {
      "x": 913,
      "y": 272
    },
    "deviationFromTracePx": 0.0,
    "note": "line_17 pt 1"
  },
  "T64": {
    "oldId": "T64",
    "v2Id": "T64",
    "status": "active",
    "targetCoords": {
      "x": 908,
      "y": 316
    },
    "deviationFromTracePx": 0.0,
    "note": "line_17 pt 2"
  },
  "HS6": {
    "oldId": "HS6",
    "v2Id": "HS6",
    "status": "active",
    "targetCoords": {
      "x": 905,
      "y": 359
    },
    "deviationFromTracePx": 0.0,
    "note": "line_17 pt 3"
  },
  "T65": {
    "oldId": "T65",
    "v2Id": "T65",
    "status": "active",
    "targetCoords": {
      "x": 896,
      "y": 386
    },
    "deviationFromTracePx": 0.0,
    "note": "line_17 pt 4"
  },
  "HS7": {
    "oldId": "HS7",
    "v2Id": "HS7",
    "status": "active",
    "targetCoords": {
      "x": 919,
      "y": 378
    },
    "deviationFromTracePx": 0.0,
    "note": "line_18 pt 1"
  },
  "T70": {
    "oldId": "T70",
    "v2Id": "T70",
    "status": "active",
    "targetCoords": {
      "x": 969,
      "y": 236
    },
    "deviationFromTracePx": 0.0,
    "note": "line_19 pt 0"
  },
  "T71": {
    "oldId": "T71",
    "v2Id": "T71",
    "status": "active",
    "targetCoords": {
      "x": 984,
      "y": 243
    },
    "deviationFromTracePx": 0.0,
    "note": "line_19 pt 1"
  },
  "T72": {
    "oldId": "T72",
    "v2Id": "T72",
    "status": "active",
    "targetCoords": {
      "x": 1009,
      "y": 251
    },
    "deviationFromTracePx": 0.0,
    "note": "line_19 pt 2"
  },
  "T34": {
    "oldId": "T34",
    "v2Id": "T34",
    "status": "active",
    "targetCoords": {
      "x": 1027,
      "y": 259
    },
    "deviationFromTracePx": 0.0,
    "note": "line_19 pt 3"
  },
  "H25L": {
    "oldId": "H25L",
    "v2Id": "H25L",
    "status": "active",
    "targetCoords": {
      "x": 1041,
      "y": 275
    },
    "deviationFromTracePx": 0.0,
    "note": "line_19 pt 4"
  },
  "T35": {
    "oldId": "T35",
    "v2Id": "T35",
    "status": "active",
    "targetCoords": {
      "x": 1047,
      "y": 290
    },
    "deviationFromTracePx": 0.0,
    "note": "line_19 pt 5"
  },
  "T36": {
    "oldId": "T36",
    "v2Id": "T36",
    "status": "active",
    "targetCoords": {
      "x": 1051,
      "y": 308
    },
    "deviationFromTracePx": 0.0,
    "note": "line_19 pt 6"
  },
  "HS10": {
    "oldId": "HS10",
    "v2Id": "HS10",
    "status": "active",
    "targetCoords": {
      "x": 1070,
      "y": 319
    },
    "deviationFromTracePx": 0.0,
    "note": "line_20 pt 1"
  },
  "T37": {
    "oldId": "T37",
    "v2Id": "T37",
    "status": "active",
    "targetCoords": {
      "x": 1044,
      "y": 326
    },
    "deviationFromTracePx": 0.0,
    "note": "line_19 pt 7"
  },
  "INTL_S1": {
    "oldId": "INTL_S1",
    "v2Id": "INTL_S1",
    "status": "active",
    "targetCoords": {
      "x": 883,
      "y": 432
    },
    "deviationFromTracePx": 0.0,
    "note": "line_38 pt 1"
  },
  "INTL_S2": {
    "oldId": "INTL_S2",
    "v2Id": "INTL_S2",
    "status": "active",
    "targetCoords": {
      "x": 920,
      "y": 414
    },
    "deviationFromTracePx": 0.0,
    "note": "line_39 pt 1"
  },
  "INTL_S3": {
    "oldId": "INTL_S3",
    "v2Id": "INTL_S3",
    "status": "active",
    "targetCoords": {
      "x": 953,
      "y": 403
    },
    "deviationFromTracePx": 0.0,
    "note": "line_40 pt 1"
  },
  "INTL_S4": {
    "oldId": "INTL_S4",
    "v2Id": "INTL_S4",
    "status": "active",
    "targetCoords": {
      "x": 988,
      "y": 394
    },
    "deviationFromTracePx": 0.0,
    "note": "line_41 pt 1"
  },
  "T38": {
    "oldId": "T38",
    "v2Id": "T38",
    "status": "active",
    "targetCoords": {
      "x": 1022,
      "y": 374
    },
    "deviationFromTracePx": 0.0,
    "note": "line_42 pt 1"
  },
  "T39": {
    "oldId": "T39",
    "v2Id": "T39",
    "status": "active",
    "targetCoords": {
      "x": 1069,
      "y": 359
    },
    "deviationFromTracePx": 0.0,
    "note": "line_43 pt 1"
  },
  "T40": {
    "oldId": "T40",
    "v2Id": "T40",
    "status": "active",
    "targetCoords": {
      "x": 1058,
      "y": 324
    },
    "deviationFromTracePx": 0.0,
    "note": "line_43 pt 0"
  },
  "T42": {
    "oldId": "T42",
    "v2Id": "T42",
    "status": "active",
    "targetCoords": {
      "x": 714,
      "y": 461
    },
    "deviationFromTracePx": 0.0,
    "note": "line_21 pt 0"
  },
  "DOM_S1": {
    "oldId": "DOM_S1",
    "v2Id": "DOM_S1",
    "status": "active",
    "targetCoords": {
      "x": 731,
      "y": 546
    },
    "deviationFromTracePx": 0.0,
    "note": "line_22 pt 1"
  },
  "DOM_S2": {
    "oldId": "DOM_S2",
    "v2Id": "DOM_S2",
    "status": "active",
    "targetCoords": {
      "x": 726,
      "y": 568
    },
    "deviationFromTracePx": 0.0,
    "note": "line_23 pt 1"
  },
  "DOM_S3": {
    "oldId": "DOM_S3",
    "v2Id": "DOM_S3",
    "status": "active",
    "targetCoords": {
      "x": 724,
      "y": 591
    },
    "deviationFromTracePx": 0.0,
    "note": "line_24 pt 1"
  },
  "T43": {
    "oldId": "T43",
    "v2Id": "T43",
    "status": "active",
    "targetCoords": {
      "x": 706,
      "y": 604
    },
    "deviationFromTracePx": 0.0,
    "note": "line_21 pt 5"
  },
  "DOM_S4": {
    "oldId": "DOM_S4",
    "v2Id": "DOM_S4",
    "status": "active",
    "targetCoords": {
      "x": 722,
      "y": 617
    },
    "deviationFromTracePx": 0.0,
    "note": "line_21 pt 7"
  },
  "DOM_S5": {
    "oldId": "DOM_S5",
    "v2Id": "DOM_S5",
    "status": "active",
    "targetCoords": {
      "x": 838,
      "y": 478
    },
    "deviationFromTracePx": 0.0,
    "note": "line_25 pt 1"
  },
  "T48": {
    "oldId": "T48",
    "v2Id": "T48",
    "status": "active",
    "targetCoords": {
      "x": 835,
      "y": 517
    },
    "deviationFromTracePx": 0.0,
    "note": "line_26 pt 1"
  },
  "T49": {
    "oldId": "T49",
    "v2Id": "T49",
    "status": "active",
    "targetCoords": {
      "x": 831,
      "y": 555
    },
    "deviationFromTracePx": 0.0,
    "note": "line_27 pt 1"
  },
  "T51": {
    "oldId": "T51",
    "v2Id": "T51",
    "status": "active",
    "targetCoords": {
      "x": 830,
      "y": 596
    },
    "deviationFromTracePx": 0.0,
    "note": "line_28 pt 1"
  },
  "T52": {
    "oldId": "T52",
    "v2Id": "T52",
    "status": "active",
    "targetCoords": {
      "x": 826,
      "y": 643
    },
    "deviationFromTracePx": 0.0,
    "note": "line_29 pt 1"
  },
  "T44": {
    "oldId": "T44",
    "v2Id": "T44",
    "status": "active",
    "targetCoords": {
      "x": 763,
      "y": 517
    },
    "deviationFromTracePx": 0.0,
    "note": "line_30 pt 0"
  },
  "T45": {
    "oldId": "T45",
    "v2Id": "T45",
    "status": "active",
    "targetCoords": {
      "x": 761,
      "y": 552
    },
    "deviationFromTracePx": 0.0,
    "note": "line_31 pt 0"
  },
  "T46": {
    "oldId": "T46",
    "v2Id": "T46",
    "status": "active",
    "targetCoords": {
      "x": 759,
      "y": 586
    },
    "deviationFromTracePx": 0.0,
    "note": "line_32 pt 0"
  },
  "T47": {
    "oldId": "T47",
    "v2Id": "T47",
    "status": "active",
    "targetCoords": {
      "x": 755,
      "y": 622
    },
    "deviationFromTracePx": 0.0,
    "note": "line_33 pt 0"
  },
  "P1": {
    "oldId": "P1",
    "v2Id": "P1",
    "status": "active",
    "targetCoords": {
      "x": 806,
      "y": 721
    },
    "deviationFromTracePx": 0.0,
    "note": "line_34 pt 2"
  },
  "P2": {
    "oldId": "P2",
    "v2Id": "P2",
    "status": "active",
    "targetCoords": {
      "x": 808,
      "y": 687
    },
    "deviationFromTracePx": 0.0,
    "note": "line_35 pt 1"
  },
  "P3": {
    "oldId": "P3",
    "v2Id": "P3",
    "status": "active",
    "targetCoords": {
      "x": 828,
      "y": 725
    },
    "deviationFromTracePx": 0.0,
    "note": "line_36 pt 1"
  },
  "P4": {
    "oldId": "P4",
    "v2Id": "P4",
    "status": "active",
    "targetCoords": {
      "x": 847,
      "y": 727
    },
    "deviationFromTracePx": 0.0,
    "note": "line_37 pt 2"
  },
  "P5": {
    "oldId": "P5",
    "v2Id": "P5",
    "status": "active",
    "targetCoords": {
      "x": 848,
      "y": 690
    },
    "deviationFromTracePx": 0.0,
    "note": "line_37 pt 1"
  },
  "HS15": {
    "oldId": "HS15",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 110,
      "y": 258
    },
    "deviationFromTracePx": 138.8,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "HS9": {
    "oldId": "HS9",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 1040,
      "y": 300
    },
    "deviationFromTracePx": 9.22,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "HS14": {
    "oldId": "HS14",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 1190,
      "y": 312
    },
    "deviationFromTracePx": 54.12,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "HS13": {
    "oldId": "HS13",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 1045,
      "y": 270
    },
    "deviationFromTracePx": 6.4,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "HS8": {
    "oldId": "HS8",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 1150,
      "y": 348
    },
    "deviationFromTracePx": 58.87,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "T6": {
    "oldId": "T6",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 1129,
      "y": 350
    },
    "deviationFromTracePx": 53.49,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "T7": {
    "oldId": "T7",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 1147,
      "y": 339
    },
    "deviationFromTracePx": 49.4,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "T8": {
    "oldId": "T8",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 1165,
      "y": 320
    },
    "deviationFromTracePx": 40.0,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "T9": {
    "oldId": "T9",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 1173,
      "y": 300
    },
    "deviationFromTracePx": 34.0,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "T50": {
    "oldId": "T50",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 741,
      "y": 685
    },
    "deviationFromTracePx": 40.2,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "T53": {
    "oldId": "T53",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 564,
      "y": 741
    },
    "deviationFromTracePx": 115.55,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "T66": {
    "oldId": "T66",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 934,
      "y": 293
    },
    "deviationFromTracePx": 23.19,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "T67": {
    "oldId": "T67",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 916,
      "y": 310
    },
    "deviationFromTracePx": 7.07,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "T68": {
    "oldId": "T68",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 916,
      "y": 350
    },
    "deviationFromTracePx": 10.05,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "T73": {
    "oldId": "T73",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 1058,
      "y": 293
    },
    "deviationFromTracePx": 10.2,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "T74": {
    "oldId": "T74",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 1188,
      "y": 286
    },
    "deviationFromTracePx": 40.71,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "T75": {
    "oldId": "T75",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 1187,
      "y": 260
    },
    "deviationFromTracePx": 27.78,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "T76": {
    "oldId": "T76",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 1168,
      "y": 241
    },
    "deviationFromTracePx": 2.24,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "T77": {
    "oldId": "T77",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 1064,
      "y": 415
    },
    "deviationFromTracePx": 56.22,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "T78": {
    "oldId": "T78",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 1132,
      "y": 415
    },
    "deviationFromTracePx": 84.29,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "T79": {
    "oldId": "T79",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 1139,
      "y": 428
    },
    "deviationFromTracePx": 98.29,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "T80": {
    "oldId": "T80",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 1137,
      "y": 443
    },
    "deviationFromTracePx": 108.07,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "T81": {
    "oldId": "T81",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 1132,
      "y": 465
    },
    "deviationFromTracePx": 123.31,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "T82": {
    "oldId": "T82",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 1149,
      "y": 437
    },
    "deviationFromTracePx": 111.73,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  },
  "T83": {
    "oldId": "T83",
    "v2Id": null,
    "status": "deprecated",
    "targetCoords": {
      "x": 1199,
      "y": 435
    },
    "deviationFromTracePx": 150.59,
    "note": "Node cũ không có vị trí tương ứng trên ảnh mới, được thay thế bằng mạng lưới liên kết V2"
  }
};
