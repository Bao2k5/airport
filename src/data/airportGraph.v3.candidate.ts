// Airport Graph V3 CANDIDATE - Strictly Filtered (No parallel stand shortcuts)
// Total Nodes: 119
// Total Sequential Edges: 84
// Total Clean Junction Edges: 41
// Total Candidate Edges: 125
// Coordinate System: SVG [0..1200] x [0..860]

import type { AirportGraph } from '../types';

export const SVG_WIDTH = 1200;
export const SVG_HEIGHT = 860;

export const airportGraphV3Candidate: AirportGraph = {
  nodes: [
    {
        "id": "v3_line_01_p00",
        "label": "",
        "type": "runway_entry",
        "x": 56,
        "y": 486,
        "description": "Raw trace line_01 point 0"
    },
    {
        "id": "v3_line_01_p01",
        "label": "",
        "type": "intersection",
        "x": 225,
        "y": 400,
        "description": "Raw trace line_01 point 1"
    },
    {
        "id": "v3_line_01_p02",
        "label": "",
        "type": "intersection",
        "x": 843,
        "y": 97,
        "description": "Raw trace line_01 point 2"
    },
    {
        "id": "v3_line_01_p03",
        "label": "STOP BAR 25R",
        "type": "runway_entry",
        "x": 931,
        "y": 57,
        "description": "Raw trace line_01 point 3 (STOP BAR 25R)"
    },
    {
        "id": "v3_line_03_p00",
        "label": "W5/07L",
        "type": "intersection",
        "x": 63,
        "y": 491,
        "description": "Raw trace line_03 point 0 (W5/07L)"
    },
    {
        "id": "v3_line_03_p01",
        "label": "W5/07R",
        "type": "intersection",
        "x": 65,
        "y": 688,
        "description": "Raw trace line_03 point 1 (W5/07R)"
    },
    {
        "id": "v3_line_04_p00",
        "label": "W4/25R",
        "type": "intersection",
        "x": 226,
        "y": 410,
        "description": "Raw trace line_04 point 0 (W4/25R)"
    },
    {
        "id": "v3_line_04_p01",
        "label": "",
        "type": "taxiway",
        "x": 223,
        "y": 434,
        "description": "Raw trace line_04 point 1"
    },
    {
        "id": "v3_line_04_p02",
        "label": "",
        "type": "taxiway",
        "x": 210,
        "y": 529,
        "description": "Raw trace line_04 point 2"
    },
    {
        "id": "v3_line_04_p03",
        "label": "W4/25L",
        "type": "intersection",
        "x": 227,
        "y": 603,
        "description": "Raw trace line_04 point 3 (W4/25L)"
    },
    {
        "id": "v3_line_05_p00",
        "label": "",
        "type": "runway_entry",
        "x": 52,
        "y": 712,
        "description": "Raw trace line_05 point 0"
    },
    {
        "id": "v3_line_05_p01",
        "label": "",
        "type": "intersection",
        "x": 232,
        "y": 620,
        "description": "Raw trace line_05 point 1"
    },
    {
        "id": "v3_line_05_p02",
        "label": "",
        "type": "intersection",
        "x": 445,
        "y": 514,
        "description": "Raw trace line_05 point 2"
    },
    {
        "id": "v3_line_05_p03",
        "label": "",
        "type": "runway_entry",
        "x": 633,
        "y": 421,
        "description": "Raw trace line_05 point 3"
    },
    {
        "id": "v3_line_05_p04",
        "label": "",
        "type": "intersection",
        "x": 819,
        "y": 331,
        "description": "Raw trace line_05 point 4"
    },
    {
        "id": "v3_line_05_p05",
        "label": "",
        "type": "intersection",
        "x": 919,
        "y": 282,
        "description": "Raw trace line_05 point 5"
    },
    {
        "id": "v3_line_05_p06",
        "label": "",
        "type": "intersection",
        "x": 965,
        "y": 260,
        "description": "Raw trace line_05 point 6"
    },
    {
        "id": "v3_line_05_p07",
        "label": "STOP BAR 25L",
        "type": "intersection",
        "x": 1136,
        "y": 177,
        "description": "Raw trace line_05 point 7 (STOP BAR 25L)"
    },
    {
        "id": "v3_line_06_p00",
        "label": "",
        "type": "taxiway",
        "x": 837,
        "y": 102,
        "description": "Raw trace line_06 point 0"
    },
    {
        "id": "v3_line_06_p01",
        "label": "NS1/25R",
        "type": "intersection",
        "x": 839,
        "y": 124,
        "description": "Raw trace line_06 point 1 (NS1/25R)"
    },
    {
        "id": "v3_line_06_p02",
        "label": "NS1/25L",
        "type": "intersection",
        "x": 826,
        "y": 280,
        "description": "Raw trace line_06 point 2 (NS1/25L)"
    },
    {
        "id": "v3_line_06_p03",
        "label": "",
        "type": "taxiway",
        "x": 813,
        "y": 335,
        "description": "Raw trace line_06 point 3"
    },
    {
        "id": "v3_line_07_p00",
        "label": "",
        "type": "taxiway",
        "x": 824,
        "y": 286,
        "description": "Raw trace line_07 point 0"
    },
    {
        "id": "v3_line_07_p01",
        "label": "",
        "type": "taxiway",
        "x": 852,
        "y": 316,
        "description": "Raw trace line_07 point 1"
    },
    {
        "id": "v3_line_08_p00",
        "label": "",
        "type": "taxiway",
        "x": 926,
        "y": 59,
        "description": "Raw trace line_08 point 0"
    },
    {
        "id": "v3_line_08_p01",
        "label": "",
        "type": "taxiway",
        "x": 937,
        "y": 81,
        "description": "Raw trace line_08 point 1"
    },
    {
        "id": "v3_line_08_p02",
        "label": "E1/25L",
        "type": "intersection",
        "x": 926,
        "y": 226,
        "description": "Raw trace line_08 point 2 (E1/25L)"
    },
    {
        "id": "v3_line_08_p03",
        "label": "",
        "type": "taxiway",
        "x": 914,
        "y": 284,
        "description": "Raw trace line_08 point 3"
    },
    {
        "id": "v3_line_09_p00",
        "label": "",
        "type": "taxiway",
        "x": 924,
        "y": 234,
        "description": "Raw trace line_09 point 0"
    },
    {
        "id": "v3_line_09_p01",
        "label": "",
        "type": "taxiway",
        "x": 950,
        "y": 266,
        "description": "Raw trace line_09 point 1"
    },
    {
        "id": "v3_line_10_p00",
        "label": "",
        "type": "taxiway",
        "x": 440,
        "y": 520,
        "description": "Raw trace line_10 point 0"
    },
    {
        "id": "v3_line_10_p01",
        "label": "W5/25L",
        "type": "intersection",
        "x": 440,
        "y": 543,
        "description": "Raw trace line_10 point 1 (W5/25L)"
    },
    {
        "id": "v3_line_10_p02",
        "label": "",
        "type": "taxiway",
        "x": 433,
        "y": 577,
        "description": "Raw trace line_10 point 2"
    },
    {
        "id": "v3_line_10_p03",
        "label": "",
        "type": "taxiway",
        "x": 441,
        "y": 624,
        "description": "Raw trace line_10 point 3"
    },
    {
        "id": "v3_line_10_p04",
        "label": "W9B/M5",
        "type": "intersection",
        "x": 432,
        "y": 651,
        "description": "Raw trace line_10 point 4 (W9B/M5)"
    },
    {
        "id": "v3_line_11_p00",
        "label": "",
        "type": "taxiway",
        "x": 439,
        "y": 619,
        "description": "Raw trace line_11 point 0"
    },
    {
        "id": "v3_line_11_p01",
        "label": "",
        "type": "taxiway",
        "x": 459,
        "y": 639,
        "description": "Raw trace line_11 point 1"
    },
    {
        "id": "v3_line_12_p00",
        "label": "",
        "type": "taxiway",
        "x": 826,
        "y": 331,
        "description": "Raw trace line_12 point 0"
    },
    {
        "id": "v3_line_12_p01",
        "label": "NS2/25L",
        "type": "intersection",
        "x": 817,
        "y": 353,
        "description": "Raw trace line_12 point 1 (NS2/25L)"
    },
    {
        "id": "v3_line_12_p02",
        "label": "E6/NS2",
        "type": "intersection",
        "x": 811,
        "y": 436,
        "description": "Raw trace line_12 point 2 (E6/NS2)"
    },
    {
        "id": "v3_line_12_p03",
        "label": "",
        "type": "taxiway",
        "x": 794,
        "y": 634,
        "description": "Raw trace line_12 point 3"
    },
    {
        "id": "v3_line_12_p04",
        "label": "",
        "type": "taxiway",
        "x": 782,
        "y": 833,
        "description": "Raw trace line_12 point 4"
    },
    {
        "id": "v3_line_13_p00",
        "label": "",
        "type": "taxiway",
        "x": 929,
        "y": 279,
        "description": "Raw trace line_13 point 0"
    },
    {
        "id": "v3_line_13_p01",
        "label": "E2/25L",
        "type": "intersection",
        "x": 916,
        "y": 306,
        "description": "Raw trace line_13 point 1 (E2/25L)"
    },
    {
        "id": "v3_line_13_p02",
        "label": "E6/E2",
        "type": "intersection",
        "x": 910,
        "y": 399,
        "description": "Raw trace line_13 point 2 (E6/E2)"
    },
    {
        "id": "v3_line_13_p03",
        "label": "",
        "type": "taxiway",
        "x": 901,
        "y": 428,
        "description": "Raw trace line_13 point 3"
    },
    {
        "id": "v3_line_15_p00",
        "label": "",
        "type": "taxiway",
        "x": 910,
        "y": 408,
        "description": "Raw trace line_15 point 0"
    },
    {
        "id": "v3_line_15_p01",
        "label": "",
        "type": "taxiway",
        "x": 926,
        "y": 423,
        "description": "Raw trace line_15 point 1"
    },
    {
        "id": "v3_line_16_p00",
        "label": "",
        "type": "taxiway",
        "x": 72,
        "y": 702,
        "description": "Raw trace line_16 point 0"
    },
    {
        "id": "v3_line_16_p01",
        "label": "W11/07R",
        "type": "intersection",
        "x": 71,
        "y": 730,
        "description": "Raw trace line_16 point 1 (W11/07R)"
    },
    {
        "id": "v3_line_16_p02",
        "label": "",
        "type": "taxiway",
        "x": 83,
        "y": 774,
        "description": "Raw trace line_16 point 2"
    },
    {
        "id": "v3_line_16_p03",
        "label": "",
        "type": "taxiway",
        "x": 96,
        "y": 797,
        "description": "Raw trace line_16 point 3"
    },
    {
        "id": "v3_line_16_p04",
        "label": "",
        "type": "taxiway",
        "x": 130,
        "y": 798,
        "description": "Raw trace line_16 point 4"
    },
    {
        "id": "v3_line_17_p00",
        "label": "",
        "type": "taxiway",
        "x": 91,
        "y": 696,
        "description": "Raw trace line_17 point 0"
    },
    {
        "id": "v3_line_17_p01",
        "label": "W9A/07R",
        "type": "intersection",
        "x": 91,
        "y": 718,
        "description": "Raw trace line_17 point 1 (W9A/07R)"
    },
    {
        "id": "v3_line_17_p02",
        "label": "",
        "type": "taxiway",
        "x": 111,
        "y": 785,
        "description": "Raw trace line_17 point 2"
    },
    {
        "id": "v3_line_17_p03",
        "label": "",
        "type": "taxiway",
        "x": 120,
        "y": 799,
        "description": "Raw trace line_17 point 3"
    },
    {
        "id": "v3_line_17_p04",
        "label": "W9B",
        "type": "intersection",
        "x": 141,
        "y": 798,
        "description": "Raw trace line_17 point 4 (W9B)"
    },
    {
        "id": "v3_line_17_p05",
        "label": "",
        "type": "taxiway",
        "x": 328,
        "y": 703,
        "description": "Raw trace line_17 point 5"
    },
    {
        "id": "v3_line_17_p06",
        "label": "",
        "type": "taxiway",
        "x": 446,
        "y": 645,
        "description": "Raw trace line_17 point 6"
    },
    {
        "id": "v3_line_17_p07",
        "label": "HS W7",
        "type": "holding_point",
        "x": 716,
        "y": 517,
        "description": "Raw trace line_17 point 7 (HS W7)"
    },
    {
        "id": "v3_line_17_p08",
        "label": "",
        "type": "taxiway",
        "x": 740,
        "y": 505,
        "description": "Raw trace line_17 point 8"
    },
    {
        "id": "v3_line_17_p09",
        "label": "HS NS",
        "type": "holding_point",
        "x": 798,
        "y": 480,
        "description": "Raw trace line_17 point 9 (HS NS)"
    },
    {
        "id": "v3_line_17_p10",
        "label": "",
        "type": "taxiway",
        "x": 822,
        "y": 469,
        "description": "Raw trace line_17 point 10"
    },
    {
        "id": "v3_line_17_p11",
        "label": "",
        "type": "taxiway",
        "x": 1052,
        "y": 366,
        "description": "Raw trace line_17 point 11"
    },
    {
        "id": "v3_line_17_p12",
        "label": "",
        "type": "taxiway",
        "x": 1074,
        "y": 356,
        "description": "Raw trace line_17 point 12"
    },
    {
        "id": "v3_line_17_p13",
        "label": "E6",
        "type": "intersection",
        "x": 1152,
        "y": 321,
        "description": "Raw trace line_17 point 13 (E6)"
    },
    {
        "id": "v3_line_17_p14",
        "label": "",
        "type": "taxiway",
        "x": 1190,
        "y": 223,
        "description": "Raw trace line_17 point 14"
    },
    {
        "id": "v3_line_17_p15",
        "label": "",
        "type": "taxiway",
        "x": 1184,
        "y": 206,
        "description": "Raw trace line_17 point 15"
    },
    {
        "id": "v3_line_17_p16",
        "label": "",
        "type": "taxiway",
        "x": 1142,
        "y": 182,
        "description": "Raw trace line_17 point 16"
    },
    {
        "id": "v3_line_18_p00",
        "label": "",
        "type": "taxiway",
        "x": 237,
        "y": 619,
        "description": "Raw trace line_18 point 0"
    },
    {
        "id": "v3_line_18_p01",
        "label": "W7A/25L",
        "type": "intersection",
        "x": 240,
        "y": 642,
        "description": "Raw trace line_18 point 1 (W7A/25L)"
    },
    {
        "id": "v3_line_18_p02",
        "label": "",
        "type": "taxiway",
        "x": 256,
        "y": 682,
        "description": "Raw trace line_18 point 2"
    },
    {
        "id": "v3_line_18_p03",
        "label": "W9B/W7A",
        "type": "intersection",
        "x": 320,
        "y": 707,
        "description": "Raw trace line_18 point 3 (W9B/W7A)"
    },
    {
        "id": "v3_line_19_p00",
        "label": "",
        "type": "taxiway",
        "x": 628,
        "y": 425,
        "description": "Raw trace line_19 point 0"
    },
    {
        "id": "v3_line_19_p01",
        "label": "W3/25L",
        "type": "intersection",
        "x": 648,
        "y": 439,
        "description": "Raw trace line_19 point 1 (W3/25L)"
    },
    {
        "id": "v3_line_19_p02",
        "label": "",
        "type": "taxiway",
        "x": 717,
        "y": 489,
        "description": "Raw trace line_19 point 2"
    },
    {
        "id": "v3_line_19_p03",
        "label": "",
        "type": "taxiway",
        "x": 710,
        "y": 519,
        "description": "Raw trace line_19 point 3"
    },
    {
        "id": "v3_line_20_p00",
        "label": "",
        "type": "taxiway",
        "x": 713,
        "y": 486,
        "description": "Raw trace line_20 point 0"
    },
    {
        "id": "v3_line_21_p00",
        "label": "",
        "type": "taxiway",
        "x": 878,
        "y": 447,
        "description": "Raw trace line_21 point 0"
    },
    {
        "id": "v3_line_21_p01",
        "label": "STAND_16",
        "type": "stand",
        "x": 887,
        "y": 482,
        "description": "Raw trace line_21 point 1 (STAND_16)"
    },
    {
        "id": "v3_line_22_p00",
        "label": "",
        "type": "taxiway",
        "x": 915,
        "y": 430,
        "description": "Raw trace line_22 point 0"
    },
    {
        "id": "v3_line_22_p01",
        "label": "STAND_17",
        "type": "stand",
        "x": 925,
        "y": 466,
        "description": "Raw trace line_22 point 1 (STAND_17)"
    },
    {
        "id": "v3_line_23_p00",
        "label": "",
        "type": "taxiway",
        "x": 946,
        "y": 412,
        "description": "Raw trace line_23 point 0"
    },
    {
        "id": "v3_line_23_p01",
        "label": "STAND_18",
        "type": "stand",
        "x": 957,
        "y": 448,
        "description": "Raw trace line_23 point 1 (STAND_18)"
    },
    {
        "id": "v3_line_24_p00",
        "label": "",
        "type": "taxiway",
        "x": 981,
        "y": 398,
        "description": "Raw trace line_24 point 0"
    },
    {
        "id": "v3_line_24_p01",
        "label": "STAND_20",
        "type": "stand",
        "x": 990,
        "y": 434,
        "description": "Raw trace line_24 point 1 (STAND_20)"
    },
    {
        "id": "v3_line_25_p00",
        "label": "",
        "type": "taxiway",
        "x": 1018,
        "y": 383,
        "description": "Raw trace line_25 point 0"
    },
    {
        "id": "v3_line_25_p01",
        "label": "STAND_21",
        "type": "stand",
        "x": 1029,
        "y": 415,
        "description": "Raw trace line_25 point 1 (STAND_21)"
    },
    {
        "id": "v3_line_26_p00",
        "label": "",
        "type": "taxiway",
        "x": 975,
        "y": 258,
        "description": "Raw trace line_26 point 0"
    },
    {
        "id": "v3_line_26_p01",
        "label": "E4/25L",
        "type": "intersection",
        "x": 993,
        "y": 274,
        "description": "Raw trace line_26 point 1 (E4/25L)"
    },
    {
        "id": "v3_line_26_p02",
        "label": "",
        "type": "taxiway",
        "x": 1036,
        "y": 293,
        "description": "Raw trace line_26 point 2"
    },
    {
        "id": "v3_line_26_p03",
        "label": "E6/E4",
        "type": "intersection",
        "x": 1063,
        "y": 356,
        "description": "Raw trace line_26 point 3 (E6/E4)"
    },
    {
        "id": "v3_line_26_p04",
        "label": "STAND_22",
        "type": "stand",
        "x": 1072,
        "y": 397,
        "description": "Raw trace line_26 point 4 (STAND_22)"
    },
    {
        "id": "v3_line_27_p00",
        "label": "",
        "type": "taxiway",
        "x": 803,
        "y": 532,
        "description": "Raw trace line_27 point 0"
    },
    {
        "id": "v3_line_27_p01",
        "label": "STAND_9",
        "type": "stand",
        "x": 844,
        "y": 535,
        "description": "Raw trace line_27 point 1 (STAND_9)"
    },
    {
        "id": "v3_line_28_p00",
        "label": "",
        "type": "taxiway",
        "x": 800,
        "y": 575,
        "description": "Raw trace line_28 point 0"
    },
    {
        "id": "v3_line_28_p01",
        "label": "STAND_8",
        "type": "stand",
        "x": 839,
        "y": 579,
        "description": "Raw trace line_28 point 1 (STAND_8)"
    },
    {
        "id": "v3_line_29_p00",
        "label": "",
        "type": "taxiway",
        "x": 796,
        "y": 621,
        "description": "Raw trace line_29 point 0"
    },
    {
        "id": "v3_line_29_p01",
        "label": "STAND_7",
        "type": "stand",
        "x": 835,
        "y": 623,
        "description": "Raw trace line_29 point 1 (STAND_7)"
    },
    {
        "id": "v3_line_30_p00",
        "label": "13",
        "type": "intersection",
        "x": 765,
        "y": 579,
        "description": "Raw trace line_30 point 0 (13)"
    },
    {
        "id": "v3_line_30_p01",
        "label": "",
        "type": "taxiway",
        "x": 798,
        "y": 585,
        "description": "Raw trace line_30 point 1"
    },
    {
        "id": "v3_line_31_p00",
        "label": "STAND_12",
        "type": "stand",
        "x": 761,
        "y": 615,
        "description": "Raw trace line_31 point 0 (STAND_12)"
    },
    {
        "id": "v3_line_31_p01",
        "label": "",
        "type": "taxiway",
        "x": 796,
        "y": 614,
        "description": "Raw trace line_31 point 1"
    },
    {
        "id": "v3_line_32_p00",
        "label": "STAND_11",
        "type": "stand",
        "x": 762,
        "y": 658,
        "description": "Raw trace line_32 point 0 (STAND_11)"
    },
    {
        "id": "v3_line_32_p01",
        "label": "",
        "type": "taxiway",
        "x": 791,
        "y": 661,
        "description": "Raw trace line_32 point 1"
    },
    {
        "id": "v3_line_33_p00",
        "label": "STAND_10",
        "type": "stand",
        "x": 759,
        "y": 697,
        "description": "Raw trace line_33 point 0 (STAND_10)"
    },
    {
        "id": "v3_line_33_p01",
        "label": "",
        "type": "taxiway",
        "x": 790,
        "y": 699,
        "description": "Raw trace line_33 point 1"
    },
    {
        "id": "v3_line_34_p00",
        "label": "",
        "type": "taxiway",
        "x": 786,
        "y": 768,
        "description": "Raw trace line_34 point 0"
    },
    {
        "id": "v3_line_34_p01",
        "label": "",
        "type": "taxiway",
        "x": 853,
        "y": 777,
        "description": "Raw trace line_34 point 1"
    },
    {
        "id": "v3_line_34_p02",
        "label": "STAND_3",
        "type": "stand",
        "x": 852,
        "y": 814,
        "description": "Raw trace line_34 point 2 (STAND_3)"
    },
    {
        "id": "v3_line_35_p00",
        "label": "STAND_4",
        "type": "stand",
        "x": 817,
        "y": 743,
        "description": "Raw trace line_35 point 0 (STAND_4)"
    },
    {
        "id": "v3_line_35_p01",
        "label": "",
        "type": "taxiway",
        "x": 815,
        "y": 770,
        "description": "Raw trace line_35 point 1"
    },
    {
        "id": "v3_line_36_p00",
        "label": "STAND_5",
        "type": "stand",
        "x": 839,
        "y": 744,
        "description": "Raw trace line_36 point 0 (STAND_5)"
    },
    {
        "id": "v3_line_36_p01",
        "label": "",
        "type": "taxiway",
        "x": 836,
        "y": 772,
        "description": "Raw trace line_36 point 1"
    },
    {
        "id": "v3_line_37_p00",
        "label": "STAND_1",
        "type": "stand",
        "x": 811,
        "y": 812,
        "description": "Raw trace line_37 point 0 (STAND_1)"
    },
    {
        "id": "v3_line_37_p01",
        "label": "",
        "type": "taxiway",
        "x": 811,
        "y": 767,
        "description": "Raw trace line_37 point 1"
    },
    {
        "id": "v3_line_38_p00",
        "label": "STAND_2",
        "type": "stand",
        "x": 831,
        "y": 810,
        "description": "Raw trace line_38 point 0 (STAND_2)"
    },
    {
        "id": "v3_line_38_p01",
        "label": "",
        "type": "taxiway",
        "x": 832,
        "y": 772,
        "description": "Raw trace line_38 point 1"
    }
],
  edges: [
    {
        "id": "v3_line_01_s00",
        "fromNodeId": "v3_line_01_p00",
        "toNodeId": "v3_line_01_p01",
        "lengthMeters": 568.9,
        "maxSpeedKts": 130,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_01_s01",
        "fromNodeId": "v3_line_01_p01",
        "toNodeId": "v3_line_01_p02",
        "lengthMeters": 2064.8,
        "maxSpeedKts": 130,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_01_s02",
        "fromNodeId": "v3_line_01_p02",
        "toNodeId": "v3_line_01_p03",
        "lengthMeters": 290.0,
        "maxSpeedKts": 130,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_03_s00",
        "fromNodeId": "v3_line_03_p00",
        "toNodeId": "v3_line_03_p01",
        "lengthMeters": 591.0,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_04_s00",
        "fromNodeId": "v3_line_04_p00",
        "toNodeId": "v3_line_04_p01",
        "lengthMeters": 72.6,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_04_s01",
        "fromNodeId": "v3_line_04_p01",
        "toNodeId": "v3_line_04_p02",
        "lengthMeters": 287.7,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_04_s02",
        "fromNodeId": "v3_line_04_p02",
        "toNodeId": "v3_line_04_p03",
        "lengthMeters": 227.8,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_05_s00",
        "fromNodeId": "v3_line_05_p00",
        "toNodeId": "v3_line_05_p01",
        "lengthMeters": 606.4,
        "maxSpeedKts": 130,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_05_s01",
        "fromNodeId": "v3_line_05_p01",
        "toNodeId": "v3_line_05_p02",
        "lengthMeters": 713.8,
        "maxSpeedKts": 130,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_05_s02",
        "fromNodeId": "v3_line_05_p02",
        "toNodeId": "v3_line_05_p03",
        "lengthMeters": 629.2,
        "maxSpeedKts": 130,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_05_s03",
        "fromNodeId": "v3_line_05_p03",
        "toNodeId": "v3_line_05_p04",
        "lengthMeters": 619.9,
        "maxSpeedKts": 130,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_05_s04",
        "fromNodeId": "v3_line_05_p04",
        "toNodeId": "v3_line_05_p05",
        "lengthMeters": 334.1,
        "maxSpeedKts": 130,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_05_s05",
        "fromNodeId": "v3_line_05_p05",
        "toNodeId": "v3_line_05_p06",
        "lengthMeters": 153.0,
        "maxSpeedKts": 130,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_05_s06",
        "fromNodeId": "v3_line_05_p06",
        "toNodeId": "v3_line_05_p07",
        "lengthMeters": 570.2,
        "maxSpeedKts": 130,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_06_s00",
        "fromNodeId": "v3_line_06_p00",
        "toNodeId": "v3_line_06_p01",
        "lengthMeters": 66.3,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_06_s01",
        "fromNodeId": "v3_line_06_p01",
        "toNodeId": "v3_line_06_p02",
        "lengthMeters": 469.6,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_06_s02",
        "fromNodeId": "v3_line_06_p02",
        "toNodeId": "v3_line_06_p03",
        "lengthMeters": 169.5,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_07_s00",
        "fromNodeId": "v3_line_07_p00",
        "toNodeId": "v3_line_07_p01",
        "lengthMeters": 123.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_08_s00",
        "fromNodeId": "v3_line_08_p00",
        "toNodeId": "v3_line_08_p01",
        "lengthMeters": 73.8,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_08_s01",
        "fromNodeId": "v3_line_08_p01",
        "toNodeId": "v3_line_08_p02",
        "lengthMeters": 436.2,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_08_s02",
        "fromNodeId": "v3_line_08_p02",
        "toNodeId": "v3_line_08_p03",
        "lengthMeters": 177.7,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_09_s00",
        "fromNodeId": "v3_line_09_p00",
        "toNodeId": "v3_line_09_p01",
        "lengthMeters": 123.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_10_s00",
        "fromNodeId": "v3_line_10_p00",
        "toNodeId": "v3_line_10_p01",
        "lengthMeters": 69.0,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_10_s01",
        "fromNodeId": "v3_line_10_p01",
        "toNodeId": "v3_line_10_p02",
        "lengthMeters": 104.1,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_10_s02",
        "fromNodeId": "v3_line_10_p02",
        "toNodeId": "v3_line_10_p03",
        "lengthMeters": 143.0,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_10_s03",
        "fromNodeId": "v3_line_10_p03",
        "toNodeId": "v3_line_10_p04",
        "lengthMeters": 85.4,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_11_s00",
        "fromNodeId": "v3_line_11_p00",
        "toNodeId": "v3_line_11_p01",
        "lengthMeters": 84.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_12_s00",
        "fromNodeId": "v3_line_12_p00",
        "toNodeId": "v3_line_12_p01",
        "lengthMeters": 71.3,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_12_s01",
        "fromNodeId": "v3_line_12_p01",
        "toNodeId": "v3_line_12_p02",
        "lengthMeters": 249.6,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_12_s02",
        "fromNodeId": "v3_line_12_p02",
        "toNodeId": "v3_line_12_p03",
        "lengthMeters": 596.2,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_12_s03a",
        "fromNodeId": "v3_line_12_p03",
        "toNodeId": "v3_line_34_p00",
        "lengthMeters": 402.7,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_12_s03b",
        "fromNodeId": "v3_line_34_p00",
        "toNodeId": "v3_line_12_p04",
        "lengthMeters": 195.4,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_13_s00",
        "fromNodeId": "v3_line_13_p00",
        "toNodeId": "v3_line_13_p01",
        "lengthMeters": 89.9,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_13_s01",
        "fromNodeId": "v3_line_13_p01",
        "toNodeId": "v3_line_13_p02",
        "lengthMeters": 279.6,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_13_s02",
        "fromNodeId": "v3_line_13_p02",
        "toNodeId": "v3_line_13_p03",
        "lengthMeters": 91.1,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_15_s00",
        "fromNodeId": "v3_line_15_p00",
        "toNodeId": "v3_line_15_p01",
        "lengthMeters": 65.8,
        "maxSpeedKts": 10,
        "type": "apron",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_16_s00",
        "fromNodeId": "v3_line_16_p00",
        "toNodeId": "v3_line_16_p01",
        "lengthMeters": 84.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_16_s01",
        "fromNodeId": "v3_line_16_p01",
        "toNodeId": "v3_line_16_p02",
        "lengthMeters": 136.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_16_s02",
        "fromNodeId": "v3_line_16_p02",
        "toNodeId": "v3_line_16_p03",
        "lengthMeters": 79.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_16_s03",
        "fromNodeId": "v3_line_16_p03",
        "toNodeId": "v3_line_16_p04",
        "lengthMeters": 102.0,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s00",
        "fromNodeId": "v3_line_17_p00",
        "toNodeId": "v3_line_17_p01",
        "lengthMeters": 66.0,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s01",
        "fromNodeId": "v3_line_17_p01",
        "toNodeId": "v3_line_17_p02",
        "lengthMeters": 209.8,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s02",
        "fromNodeId": "v3_line_17_p02",
        "toNodeId": "v3_line_17_p03",
        "lengthMeters": 49.9,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s03",
        "fromNodeId": "v3_line_17_p03",
        "toNodeId": "v3_line_17_p04",
        "lengthMeters": 63.1,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s04",
        "fromNodeId": "v3_line_17_p04",
        "toNodeId": "v3_line_17_p05",
        "lengthMeters": 629.2,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s05",
        "fromNodeId": "v3_line_17_p05",
        "toNodeId": "v3_line_17_p06",
        "lengthMeters": 394.5,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s06",
        "fromNodeId": "v3_line_17_p06",
        "toNodeId": "v3_line_17_p07",
        "lengthMeters": 896.4,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s07",
        "fromNodeId": "v3_line_17_p07",
        "toNodeId": "v3_line_17_p08",
        "lengthMeters": 80.5,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s08",
        "fromNodeId": "v3_line_17_p08",
        "toNodeId": "v3_line_17_p09",
        "lengthMeters": 189.5,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s09",
        "fromNodeId": "v3_line_17_p09",
        "toNodeId": "v3_line_17_p10",
        "lengthMeters": 79.2,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s10",
        "fromNodeId": "v3_line_17_p10",
        "toNodeId": "v3_line_17_p11",
        "lengthMeters": 756.0,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s11",
        "fromNodeId": "v3_line_17_p11",
        "toNodeId": "v3_line_17_p12",
        "lengthMeters": 72.5,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s12",
        "fromNodeId": "v3_line_17_p12",
        "toNodeId": "v3_line_17_p13",
        "lengthMeters": 256.5,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s13",
        "fromNodeId": "v3_line_17_p13",
        "toNodeId": "v3_line_17_p14",
        "lengthMeters": 315.3,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s14",
        "fromNodeId": "v3_line_17_p14",
        "toNodeId": "v3_line_17_p15",
        "lengthMeters": 54.1,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s15",
        "fromNodeId": "v3_line_17_p15",
        "toNodeId": "v3_line_17_p16",
        "lengthMeters": 145.1,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_18_s00",
        "fromNodeId": "v3_line_18_p00",
        "toNodeId": "v3_line_18_p01",
        "lengthMeters": 69.6,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_18_s01",
        "fromNodeId": "v3_line_18_p01",
        "toNodeId": "v3_line_18_p02",
        "lengthMeters": 129.2,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_18_s02",
        "fromNodeId": "v3_line_18_p02",
        "toNodeId": "v3_line_18_p03",
        "lengthMeters": 206.1,
        "maxSpeedKts": 20,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_19_s00",
        "fromNodeId": "v3_line_19_p00",
        "toNodeId": "v3_line_19_p01",
        "lengthMeters": 73.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_19_s01",
        "fromNodeId": "v3_line_19_p01",
        "toNodeId": "v3_line_19_p02",
        "lengthMeters": 255.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_19_s02",
        "fromNodeId": "v3_line_19_p02",
        "toNodeId": "v3_line_19_p03",
        "lengthMeters": 92.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_21_s00",
        "fromNodeId": "v3_line_21_p00",
        "toNodeId": "v3_line_21_p01",
        "lengthMeters": 108.4,
        "maxSpeedKts": 7,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_22_s00",
        "fromNodeId": "v3_line_22_p00",
        "toNodeId": "v3_line_22_p01",
        "lengthMeters": 112.1,
        "maxSpeedKts": 7,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_23_s00",
        "fromNodeId": "v3_line_23_p00",
        "toNodeId": "v3_line_23_p01",
        "lengthMeters": 112.9,
        "maxSpeedKts": 7,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_24_s00",
        "fromNodeId": "v3_line_24_p00",
        "toNodeId": "v3_line_24_p01",
        "lengthMeters": 111.3,
        "maxSpeedKts": 7,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_25_s00",
        "fromNodeId": "v3_line_25_p00",
        "toNodeId": "v3_line_25_p01",
        "lengthMeters": 101.5,
        "maxSpeedKts": 7,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_26_s00",
        "fromNodeId": "v3_line_26_p00",
        "toNodeId": "v3_line_26_p01",
        "lengthMeters": 72.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_26_s01",
        "fromNodeId": "v3_line_26_p01",
        "toNodeId": "v3_line_26_p02",
        "lengthMeters": 141.0,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_26_s02",
        "fromNodeId": "v3_line_26_p02",
        "toNodeId": "v3_line_26_p03",
        "lengthMeters": 205.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_26_s03",
        "fromNodeId": "v3_line_26_p03",
        "toNodeId": "v3_line_26_p04",
        "lengthMeters": 125.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_27_s00",
        "fromNodeId": "v3_line_27_p00",
        "toNodeId": "v3_line_27_p01",
        "lengthMeters": 123.3,
        "maxSpeedKts": 7,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_28_s00",
        "fromNodeId": "v3_line_28_p00",
        "toNodeId": "v3_line_28_p01",
        "lengthMeters": 117.6,
        "maxSpeedKts": 7,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_29_s00",
        "fromNodeId": "v3_line_29_p00",
        "toNodeId": "v3_line_29_p01",
        "lengthMeters": 117.2,
        "maxSpeedKts": 7,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_30_s00",
        "fromNodeId": "v3_line_30_p00",
        "toNodeId": "v3_line_30_p01",
        "lengthMeters": 100.6,
        "maxSpeedKts": 7,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_31_s00",
        "fromNodeId": "v3_line_31_p00",
        "toNodeId": "v3_line_31_p01",
        "lengthMeters": 105.0,
        "maxSpeedKts": 7,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_32_s00",
        "fromNodeId": "v3_line_32_p00",
        "toNodeId": "v3_line_32_p01",
        "lengthMeters": 87.5,
        "maxSpeedKts": 7,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_33_s00",
        "fromNodeId": "v3_line_33_p00",
        "toNodeId": "v3_line_33_p01",
        "lengthMeters": 93.2,
        "maxSpeedKts": 7,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_34_s00",
        "fromNodeId": "v3_line_34_p00",
        "toNodeId": "v3_line_34_p01",
        "lengthMeters": 202.8,
        "maxSpeedKts": 7,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_34_s01",
        "fromNodeId": "v3_line_34_p01",
        "toNodeId": "v3_line_34_p02",
        "lengthMeters": 111.0,
        "maxSpeedKts": 7,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_35_s00",
        "fromNodeId": "v3_line_35_p00",
        "toNodeId": "v3_line_35_p01",
        "lengthMeters": 81.2,
        "maxSpeedKts": 7,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_36_s00",
        "fromNodeId": "v3_line_36_p00",
        "toNodeId": "v3_line_36_p01",
        "lengthMeters": 84.5,
        "maxSpeedKts": 7,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_37_s00",
        "fromNodeId": "v3_line_37_p00",
        "toNodeId": "v3_line_37_p01",
        "lengthMeters": 135.0,
        "maxSpeedKts": 7,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_38_s00",
        "fromNodeId": "v3_line_38_p00",
        "toNodeId": "v3_line_38_p01",
        "lengthMeters": 114.0,
        "maxSpeedKts": 7,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J01",
        "fromNodeId": "v3_line_19_p02",
        "toNodeId": "v3_line_20_p00",
        "lengthMeters": 15.0,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J02",
        "fromNodeId": "v3_line_05_p01",
        "toNodeId": "v3_line_18_p00",
        "lengthMeters": 15.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J03",
        "fromNodeId": "v3_line_01_p03",
        "toNodeId": "v3_line_08_p00",
        "lengthMeters": 16.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J04",
        "fromNodeId": "v3_line_05_p05",
        "toNodeId": "v3_line_08_p03",
        "lengthMeters": 16.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J05",
        "fromNodeId": "v3_line_10_p03",
        "toNodeId": "v3_line_11_p00",
        "lengthMeters": 16.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J06",
        "fromNodeId": "v3_line_06_p02",
        "toNodeId": "v3_line_07_p00",
        "lengthMeters": 19.0,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J07",
        "fromNodeId": "v3_line_17_p07",
        "toNodeId": "v3_line_19_p03",
        "lengthMeters": 19.0,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J08",
        "fromNodeId": "v3_line_05_p03",
        "toNodeId": "v3_line_19_p00",
        "lengthMeters": 19.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J09",
        "fromNodeId": "v3_line_05_p04",
        "toNodeId": "v3_line_12_p00",
        "lengthMeters": 21.0,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J10",
        "fromNodeId": "v3_line_05_p04",
        "toNodeId": "v3_line_06_p03",
        "lengthMeters": 21.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J11",
        "fromNodeId": "v3_line_01_p02",
        "toNodeId": "v3_line_06_p00",
        "lengthMeters": 23.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J12",
        "fromNodeId": "v3_line_05_p02",
        "toNodeId": "v3_line_10_p00",
        "lengthMeters": 23.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J13",
        "fromNodeId": "v3_line_05_p07",
        "toNodeId": "v3_line_17_p16",
        "lengthMeters": 23.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J14",
        "fromNodeId": "v3_line_08_p02",
        "toNodeId": "v3_line_09_p00",
        "lengthMeters": 24.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J15",
        "fromNodeId": "v3_line_01_p00",
        "toNodeId": "v3_line_03_p00",
        "lengthMeters": 25.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J16",
        "fromNodeId": "v3_line_17_p05",
        "toNodeId": "v3_line_18_p03",
        "lengthMeters": 26.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J17",
        "fromNodeId": "v3_line_13_p02",
        "toNodeId": "v3_line_15_p00",
        "lengthMeters": 27.0,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J18",
        "fromNodeId": "v3_line_01_p01",
        "toNodeId": "v3_line_04_p00",
        "lengthMeters": 30.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J19",
        "fromNodeId": "v3_line_16_p04",
        "toNodeId": "v3_line_17_p03",
        "lengthMeters": 30.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J20",
        "fromNodeId": "v3_line_05_p06",
        "toNodeId": "v3_line_26_p00",
        "lengthMeters": 30.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J21",
        "fromNodeId": "v3_line_05_p05",
        "toNodeId": "v3_line_13_p00",
        "lengthMeters": 31.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J22",
        "fromNodeId": "v3_line_16_p04",
        "toNodeId": "v3_line_17_p04",
        "lengthMeters": 33.0,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J23",
        "fromNodeId": "v3_line_17_p12",
        "toNodeId": "v3_line_26_p03",
        "lengthMeters": 33.0,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J24",
        "fromNodeId": "v3_line_15_p01",
        "toNodeId": "v3_line_22_p00",
        "lengthMeters": 39.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J25",
        "fromNodeId": "v3_line_12_p03",
        "toNodeId": "v3_line_29_p00",
        "lengthMeters": 39.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J26",
        "fromNodeId": "v3_line_13_p03",
        "toNodeId": "v3_line_22_p00",
        "lengthMeters": 42.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J27",
        "fromNodeId": "v3_line_36_p01",
        "toNodeId": "v3_line_38_p01",
        "lengthMeters": 12.0,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J28",
        "fromNodeId": "v3_line_35_p01",
        "toNodeId": "v3_line_37_p01",
        "lengthMeters": 15.0,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J29",
        "fromNodeId": "v3_line_29_p00",
        "toNodeId": "v3_line_31_p01",
        "lengthMeters": 21.0,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J30",
        "fromNodeId": "v3_line_28_p00",
        "toNodeId": "v3_line_30_p01",
        "lengthMeters": 30.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J31",
        "fromNodeId": "v3_line_06_p03",
        "toNodeId": "v3_line_12_p00",
        "lengthMeters": 40.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J32",
        "fromNodeId": "v3_line_11_p01",
        "toNodeId": "v3_line_17_p06",
        "lengthMeters": 43.0,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J33",
        "fromNodeId": "v3_line_03_p01",
        "toNodeId": "v3_line_16_p00",
        "lengthMeters": 47.0,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J34",
        "fromNodeId": "v3_line_08_p03",
        "toNodeId": "v3_line_13_p00",
        "lengthMeters": 47.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J35",
        "fromNodeId": "v3_line_04_p03",
        "toNodeId": "v3_line_18_p00",
        "lengthMeters": 56.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J36",
        "fromNodeId": "v3_line_16_p00",
        "toNodeId": "v3_line_17_p00",
        "lengthMeters": 59.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J37",
        "fromNodeId": "v3_line_13_p03",
        "toNodeId": "v3_line_15_p00",
        "lengthMeters": 65.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J38",
        "fromNodeId": "v3_line_05_p00",
        "toNodeId": "v3_line_16_p00",
        "lengthMeters": 67.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J39",
        "fromNodeId": "v3_line_15_p00",
        "toNodeId": "v3_line_22_p00",
        "lengthMeters": 67.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J40",
        "fromNodeId": "v3_line_15_p01",
        "toNodeId": "v3_line_23_p00",
        "lengthMeters": 68.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J41",
        "fromNodeId": "v3_line_09_p01",
        "toNodeId": "v3_line_13_p00",
        "lengthMeters": 74.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    }
]
};
