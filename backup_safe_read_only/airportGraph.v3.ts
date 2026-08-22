// Airport Graph V3 - Master Production Calibrated (TSN Airport)
// Total Nodes: 145 (44 operational named nodes + 101 geometry-only nodes)
// Total Edges: 289 (96 sequential + 193 junction edges)
// Coordinate System: SVG [0..1200] x [0..860] aligned to /anhchinh.png

import type { AirportGraph } from '../types';

export const SVG_WIDTH = 1200;
export const SVG_HEIGHT = 860;

export const airportGraphV3: AirportGraph = {
  nodes: [
    {
        "id": "v3_line_01_p00",
        "label": "07L",
        "type": "holding_point",
        "x": 56,
        "y": 486
    },
    {
        "id": "v3_line_01_p01",
        "label": "",
        "type": "taxiway",
        "x": 225,
        "y": 400
    },
    {
        "id": "v3_line_01_p02",
        "label": "",
        "type": "taxiway",
        "x": 843,
        "y": 97
    },
    {
        "id": "v3_line_01_p03",
        "label": "STOP BAR 25R",
        "type": "holding_point",
        "x": 931,
        "y": 57
    },
    {
        "id": "v3_line_03_p00",
        "label": "W5/07L",
        "type": "holding_point",
        "x": 63,
        "y": 491
    },
    {
        "id": "v3_line_03_p01",
        "label": "W5/07R",
        "type": "holding_point",
        "x": 65,
        "y": 688
    },
    {
        "id": "v3_line_04_p00",
        "label": "W4/25R",
        "type": "holding_point",
        "x": 226,
        "y": 410
    },
    {
        "id": "v3_line_04_p01",
        "label": "",
        "type": "taxiway",
        "x": 223,
        "y": 434
    },
    {
        "id": "v3_line_04_p02",
        "label": "",
        "type": "taxiway",
        "x": 210,
        "y": 529
    },
    {
        "id": "v3_line_04_p03",
        "label": "W4/25L",
        "type": "holding_point",
        "x": 227,
        "y": 603
    },
    {
        "id": "v3_line_05_p00",
        "label": "07R",
        "type": "holding_point",
        "x": 52,
        "y": 712
    },
    {
        "id": "v3_line_05_p01",
        "label": "",
        "type": "taxiway",
        "x": 232,
        "y": 620
    },
    {
        "id": "v3_line_05_p02",
        "label": "",
        "type": "taxiway",
        "x": 445,
        "y": 514
    },
    {
        "id": "v3_line_05_p03",
        "label": "",
        "type": "taxiway",
        "x": 633,
        "y": 421
    },
    {
        "id": "v3_line_05_p04",
        "label": "",
        "type": "taxiway",
        "x": 819,
        "y": 331
    },
    {
        "id": "v3_line_05_p05",
        "label": "T63",
        "type": "taxiway",
        "x": 919,
        "y": 282
    },
    {
        "id": "v3_line_05_p06",
        "label": "",
        "type": "taxiway",
        "x": 965,
        "y": 260
    },
    {
        "id": "v3_line_05_p07",
        "label": "STOP BAR 25L",
        "type": "holding_point",
        "x": 1136,
        "y": 177
    },
    {
        "id": "v3_line_06_p00",
        "label": "L12_P0",
        "type": "taxiway",
        "x": 837,
        "y": 102
    },
    {
        "id": "v3_line_06_p01",
        "label": "NS1/25R",
        "type": "holding_point",
        "x": 839,
        "y": 124
    },
    {
        "id": "v3_line_06_p02",
        "label": "NS1/25L",
        "type": "holding_point",
        "x": 826,
        "y": 280
    },
    {
        "id": "v3_line_06_p03",
        "label": "",
        "type": "taxiway",
        "x": 813,
        "y": 335
    },
    {
        "id": "v3_line_07_p00",
        "label": "NS1_MID_JUNCTION_V2",
        "type": "taxiway",
        "x": 824,
        "y": 286
    },
    {
        "id": "v3_line_07_p01",
        "label": "",
        "type": "taxiway",
        "x": 852,
        "y": 316
    },
    {
        "id": "v3_line_08_p00",
        "label": "W7",
        "type": "taxiway",
        "x": 926,
        "y": 59
    },
    {
        "id": "v3_line_08_p01",
        "label": "H25R",
        "type": "holding_point",
        "x": 937,
        "y": 81
    },
    {
        "id": "v3_line_08_p02",
        "label": "E1/25L",
        "type": "holding_point",
        "x": 926,
        "y": 226
    },
    {
        "id": "v3_line_08_p03",
        "label": "",
        "type": "taxiway",
        "x": 914,
        "y": 284
    },
    {
        "id": "v3_line_09_p00",
        "label": "",
        "type": "taxiway",
        "x": 924,
        "y": 234
    },
    {
        "id": "v3_line_09_p01",
        "label": "",
        "type": "taxiway",
        "x": 950,
        "y": 266
    },
    {
        "id": "v3_line_10_p00",
        "label": "",
        "type": "taxiway",
        "x": 440,
        "y": 520
    },
    {
        "id": "v3_line_10_p01",
        "label": "W5/25L",
        "type": "holding_point",
        "x": 440,
        "y": 543
    },
    {
        "id": "v3_line_10_p02",
        "label": "T26",
        "type": "taxiway",
        "x": 433,
        "y": 577
    },
    {
        "id": "v3_line_10_p03",
        "label": "",
        "type": "taxiway",
        "x": 441,
        "y": 624
    },
    {
        "id": "v3_line_10_p04",
        "label": "W9B/M5",
        "type": "taxiway",
        "x": 432,
        "y": 651
    },
    {
        "id": "v3_line_11_p00",
        "label": "",
        "type": "taxiway",
        "x": 439,
        "y": 619
    },
    {
        "id": "v3_line_11_p01",
        "label": "",
        "type": "taxiway",
        "x": 459,
        "y": 639
    },
    {
        "id": "v3_line_12_p00",
        "label": "",
        "type": "taxiway",
        "x": 826,
        "y": 331
    },
    {
        "id": "v3_line_12_p01",
        "label": "NS2/25L",
        "type": "holding_point",
        "x": 817,
        "y": 353
    },
    {
        "id": "v3_line_12_p02",
        "label": "E6/NS2",
        "type": "taxiway",
        "x": 811,
        "y": 436
    },
    {
        "id": "v3_line_12_p03",
        "label": "T69",
        "type": "taxiway",
        "x": 794,
        "y": 634
    },
    {
        "id": "v3_line_12_p04",
        "label": "",
        "type": "taxiway",
        "x": 782,
        "y": 833
    },
    {
        "id": "v3_line_13_p00",
        "label": "",
        "type": "taxiway",
        "x": 929,
        "y": 279
    },
    {
        "id": "v3_line_13_p01",
        "label": "E2/25L",
        "type": "holding_point",
        "x": 916,
        "y": 306
    },
    {
        "id": "v3_line_13_p02",
        "label": "E6/E2",
        "type": "taxiway",
        "x": 910,
        "y": 399
    },
    {
        "id": "v3_line_13_p03",
        "label": "",
        "type": "taxiway",
        "x": 901,
        "y": 428
    },
    {
        "id": "v3_line_15_p00",
        "label": "INTL_S2",
        "type": "taxiway",
        "x": 910,
        "y": 408
    },
    {
        "id": "v3_line_15_p01",
        "label": "INTL_S2",
        "type": "taxiway",
        "x": 926,
        "y": 423
    },
    {
        "id": "v3_line_16_p00",
        "label": "",
        "type": "taxiway",
        "x": 72,
        "y": 702
    },
    {
        "id": "v3_line_16_p01",
        "label": "W11/07R",
        "type": "holding_point",
        "x": 71,
        "y": 730
    },
    {
        "id": "v3_line_16_p02",
        "label": "",
        "type": "taxiway",
        "x": 83,
        "y": 774
    },
    {
        "id": "v3_line_16_p03",
        "label": "",
        "type": "taxiway",
        "x": 96,
        "y": 797
    },
    {
        "id": "v3_line_16_p04",
        "label": "",
        "type": "taxiway",
        "x": 130,
        "y": 798
    },
    {
        "id": "v3_line_17_p00",
        "label": "L03_P3",
        "type": "taxiway",
        "x": 91,
        "y": 696
    },
    {
        "id": "v3_line_17_p01",
        "label": "W9A/07R",
        "type": "holding_point",
        "x": 91,
        "y": 718
    },
    {
        "id": "v3_line_17_p02",
        "label": "",
        "type": "taxiway",
        "x": 111,
        "y": 785
    },
    {
        "id": "v3_line_17_p03",
        "label": "",
        "type": "taxiway",
        "x": 120,
        "y": 799
    },
    {
        "id": "v3_line_17_p04",
        "label": "W9B",
        "type": "taxiway",
        "x": 141,
        "y": 798
    },
    {
        "id": "v3_line_17_p05",
        "label": "",
        "type": "taxiway",
        "x": 328,
        "y": 703
    },
    {
        "id": "v3_line_17_p06",
        "label": "T27",
        "type": "taxiway",
        "x": 446,
        "y": 645
    },
    {
        "id": "v3_line_17_p07",
        "label": "HS W7",
        "type": "holding_point",
        "x": 716,
        "y": 517
    },
    {
        "id": "v3_line_17_p08",
        "label": "",
        "type": "taxiway",
        "x": 740,
        "y": 505
    },
    {
        "id": "v3_line_17_p09",
        "label": "HS NS",
        "type": "holding_point",
        "x": 798,
        "y": 480
    },
    {
        "id": "v3_line_17_p10",
        "label": "",
        "type": "taxiway",
        "x": 822,
        "y": 469
    },
    {
        "id": "v3_line_17_p11",
        "label": "",
        "type": "taxiway",
        "x": 1052,
        "y": 366
    },
    {
        "id": "v3_line_17_p12",
        "label": "T39",
        "type": "taxiway",
        "x": 1074,
        "y": 356
    },
    {
        "id": "v3_line_17_p13",
        "label": "E6",
        "type": "taxiway",
        "x": 1152,
        "y": 321
    },
    {
        "id": "v3_line_17_p14",
        "label": "",
        "type": "taxiway",
        "x": 1190,
        "y": 223
    },
    {
        "id": "v3_line_17_p15",
        "label": "L03_P18",
        "type": "taxiway",
        "x": 1184,
        "y": 206
    },
    {
        "id": "v3_line_17_p16",
        "label": "",
        "type": "taxiway",
        "x": 1142,
        "y": 182
    },
    {
        "id": "v3_line_18_p00",
        "label": "",
        "type": "taxiway",
        "x": 237,
        "y": 619
    },
    {
        "id": "v3_line_18_p01",
        "label": "W7A/25L",
        "type": "holding_point",
        "x": 240,
        "y": 642
    },
    {
        "id": "v3_line_18_p02",
        "label": "",
        "type": "taxiway",
        "x": 256,
        "y": 682
    },
    {
        "id": "v3_line_18_p03",
        "label": "W9B/W7A",
        "type": "taxiway",
        "x": 320,
        "y": 707
    },
    {
        "id": "v3_line_19_p00",
        "label": "",
        "type": "taxiway",
        "x": 628,
        "y": 425
    },
    {
        "id": "v3_line_19_p01",
        "label": "W3/25L",
        "type": "holding_point",
        "x": 648,
        "y": 439
    },
    {
        "id": "v3_line_19_p02",
        "label": "",
        "type": "taxiway",
        "x": 717,
        "y": 489
    },
    {
        "id": "v3_line_19_p03",
        "label": "L21_P3",
        "type": "taxiway",
        "x": 710,
        "y": 519
    },
    {
        "id": "v3_line_20_p00",
        "label": "",
        "type": "taxiway",
        "x": 713,
        "y": 486
    },
    {
        "id": "v3_line_21_p00",
        "label": "",
        "type": "taxiway",
        "x": 878,
        "y": 447
    },
    {
        "id": "v3_line_21_p01",
        "label": "STAND_16",
        "type": "stand",
        "x": 887,
        "y": 482
    },
    {
        "id": "v3_line_22_p00",
        "label": "",
        "type": "taxiway",
        "x": 915,
        "y": 430
    },
    {
        "id": "v3_line_22_p01",
        "label": "STAND_17",
        "type": "stand",
        "x": 925,
        "y": 466
    },
    {
        "id": "v3_line_23_p00",
        "label": "INTL_S3",
        "type": "taxiway",
        "x": 946,
        "y": 412
    },
    {
        "id": "v3_line_23_p01",
        "label": "STAND_18",
        "type": "stand",
        "x": 957,
        "y": 448
    },
    {
        "id": "v3_line_24_p00",
        "label": "INTL_S4",
        "type": "taxiway",
        "x": 981,
        "y": 398
    },
    {
        "id": "v3_line_24_p01",
        "label": "STAND_20",
        "type": "stand",
        "x": 990,
        "y": 434
    },
    {
        "id": "v3_line_25_p00",
        "label": "T38",
        "type": "taxiway",
        "x": 1018,
        "y": 383
    },
    {
        "id": "v3_line_25_p01",
        "label": "STAND_21",
        "type": "stand",
        "x": 1029,
        "y": 415
    },
    {
        "id": "v3_line_26_p00",
        "label": "",
        "type": "taxiway",
        "x": 975,
        "y": 258
    },
    {
        "id": "v3_line_26_p01",
        "label": "E4/25L",
        "type": "holding_point",
        "x": 993,
        "y": 274
    },
    {
        "id": "v3_line_26_p02",
        "label": "T35",
        "type": "taxiway",
        "x": 1036,
        "y": 293
    },
    {
        "id": "v3_line_26_p03",
        "label": "E6/E4",
        "type": "taxiway",
        "x": 1063,
        "y": 356
    },
    {
        "id": "v3_line_26_p04",
        "label": "STAND_22",
        "type": "stand",
        "x": 1072,
        "y": 397
    },
    {
        "id": "v3_line_27_p00",
        "label": "",
        "type": "taxiway",
        "x": 803,
        "y": 532
    },
    {
        "id": "v3_line_27_p01",
        "label": "STAND_9",
        "type": "stand",
        "x": 844,
        "y": 535
    },
    {
        "id": "v3_line_28_p00",
        "label": "",
        "type": "taxiway",
        "x": 800,
        "y": 575
    },
    {
        "id": "v3_line_28_p01",
        "label": "STAND_8",
        "type": "stand",
        "x": 839,
        "y": 579
    },
    {
        "id": "v3_line_29_p00",
        "label": "",
        "type": "taxiway",
        "x": 796,
        "y": 621
    },
    {
        "id": "v3_line_29_p01",
        "label": "STAND_7",
        "type": "stand",
        "x": 835,
        "y": 623
    },
    {
        "id": "v3_line_30_p00",
        "label": "STAND_13",
        "type": "stand",
        "x": 765,
        "y": 579
    },
    {
        "id": "v3_line_30_p01",
        "label": "L28_ENT",
        "type": "taxiway",
        "x": 798,
        "y": 585
    },
    {
        "id": "v3_line_31_p00",
        "label": "STAND_12",
        "type": "stand",
        "x": 761,
        "y": 615
    },
    {
        "id": "v3_line_31_p01",
        "label": "",
        "type": "taxiway",
        "x": 796,
        "y": 614
    },
    {
        "id": "v3_line_32_p00",
        "label": "STAND_11",
        "type": "stand",
        "x": 762,
        "y": 658
    },
    {
        "id": "v3_line_32_p01",
        "label": "",
        "type": "taxiway",
        "x": 791,
        "y": 661
    },
    {
        "id": "v3_line_33_p00",
        "label": "STAND_10",
        "type": "stand",
        "x": 759,
        "y": 697
    },
    {
        "id": "v3_line_33_p01",
        "label": "",
        "type": "taxiway",
        "x": 790,
        "y": 699
    },
    {
        "id": "v3_line_34_p00",
        "label": "NS1_SOUTH_END_V2",
        "type": "taxiway",
        "x": 786,
        "y": 768
    },
    {
        "id": "v3_line_34_p01",
        "label": "",
        "type": "taxiway",
        "x": 853,
        "y": 777
    },
    {
        "id": "v3_line_34_p02",
        "label": "STAND_3",
        "type": "stand",
        "x": 852,
        "y": 814
    },
    {
        "id": "v3_line_35_p00",
        "label": "STAND_4",
        "type": "stand",
        "x": 817,
        "y": 743
    },
    {
        "id": "v3_line_35_p01",
        "label": "",
        "type": "taxiway",
        "x": 815,
        "y": 770
    },
    {
        "id": "v3_line_36_p00",
        "label": "STAND_5",
        "type": "stand",
        "x": 839,
        "y": 744
    },
    {
        "id": "v3_line_36_p01",
        "label": "",
        "type": "taxiway",
        "x": 836,
        "y": 772
    },
    {
        "id": "v3_line_37_p00",
        "label": "STAND_1",
        "type": "stand",
        "x": 811,
        "y": 812
    },
    {
        "id": "v3_line_37_p01",
        "label": "",
        "type": "taxiway",
        "x": 811,
        "y": 767
    },
    {
        "id": "v3_line_38_p00",
        "label": "STAND_2",
        "type": "stand",
        "x": 831,
        "y": 810
    },
    {
        "id": "v3_line_38_p01",
        "label": "",
        "type": "taxiway",
        "x": 832,
        "y": 772
    },
    {
        "id": "v3_line_39_p00",
        "label": "",
        "type": "taxiway",
        "x": 65,
        "y": 483
    },
    {
        "id": "v3_line_39_p01",
        "label": "",
        "type": "taxiway",
        "x": 64,
        "y": 492
    },
    {
        "id": "v3_line_40_p00",
        "label": "",
        "type": "taxiway",
        "x": 231,
        "y": 398
    },
    {
        "id": "v3_line_40_p01",
        "label": "",
        "type": "taxiway",
        "x": 226,
        "y": 411
    },
    {
        "id": "v3_line_41_p00",
        "label": "",
        "type": "taxiway",
        "x": 67,
        "y": 688
    },
    {
        "id": "v3_line_41_p01",
        "label": "",
        "type": "taxiway",
        "x": 76,
        "y": 701
    },
    {
        "id": "v3_line_42_p00",
        "label": "",
        "type": "taxiway",
        "x": 91,
        "y": 696
    },
    {
        "id": "v3_line_42_p01",
        "label": "",
        "type": "taxiway",
        "x": 93,
        "y": 691
    },
    {
        "id": "v3_line_43_p00",
        "label": "",
        "type": "taxiway",
        "x": 227,
        "y": 603
    },
    {
        "id": "v3_line_43_p01",
        "label": "",
        "type": "taxiway",
        "x": 234,
        "y": 620
    },
    {
        "id": "v3_line_45_p00",
        "label": "",
        "type": "taxiway",
        "x": 442,
        "y": 520
    },
    {
        "id": "v3_line_45_p01",
        "label": "",
        "type": "taxiway",
        "x": 440,
        "y": 516
    },
    {
        "id": "v3_line_46_p00",
        "label": "",
        "type": "taxiway",
        "x": 713,
        "y": 488
    },
    {
        "id": "v3_line_46_p01",
        "label": "",
        "type": "taxiway",
        "x": 740,
        "y": 504
    },
    {
        "id": "v3_line_47_p00",
        "label": "",
        "type": "taxiway",
        "x": 900,
        "y": 424
    },
    {
        "id": "v3_line_47_p01",
        "label": "",
        "type": "taxiway",
        "x": 893,
        "y": 438
    },
    {
        "id": "v3_line_50_p00",
        "label": "",
        "type": "taxiway",
        "x": 1144,
        "y": 183
    },
    {
        "id": "v3_line_50_p01",
        "label": "",
        "type": "taxiway",
        "x": 1135,
        "y": 176
    },
    {
        "id": "v3_line_51_p00",
        "label": "",
        "type": "taxiway",
        "x": 816,
        "y": 352
    },
    {
        "id": "v3_line_51_p01",
        "label": "",
        "type": "taxiway",
        "x": 812,
        "y": 335
    },
    {
        "id": "v3_line_52_p00",
        "label": "",
        "type": "taxiway",
        "x": 66,
        "y": 688
    },
    {
        "id": "v3_line_52_p01",
        "label": "",
        "type": "taxiway",
        "x": 71,
        "y": 731
    },
    {
        "id": "v3_line_53_p00",
        "label": "",
        "type": "taxiway",
        "x": 93,
        "y": 696
    },
    {
        "id": "v3_line_53_p01",
        "label": "",
        "type": "taxiway",
        "x": 95,
        "y": 690
    },
    {
        "id": "v3_line_55_p00",
        "label": "",
        "type": "taxiway",
        "x": 915,
        "y": 283
    },
    {
        "id": "v3_line_55_p01",
        "label": "",
        "type": "taxiway",
        "x": 915,
        "y": 305
    }
],
  edges: [
    {
        "id": "v3_line_01_s00",
        "fromNodeId": "v3_line_01_p00",
        "toNodeId": "v3_line_01_p01",
        "lengthMeters": 189.6,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_01_s01",
        "fromNodeId": "v3_line_01_p01",
        "toNodeId": "v3_line_01_p02",
        "lengthMeters": 688.3,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_01_s02",
        "fromNodeId": "v3_line_01_p02",
        "toNodeId": "v3_line_01_p03",
        "lengthMeters": 96.7,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_03_s00",
        "fromNodeId": "v3_line_03_p00",
        "toNodeId": "v3_line_03_p01",
        "lengthMeters": 197,
        "maxSpeedKts": 30,
        "type": "runway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_04_s00",
        "fromNodeId": "v3_line_04_p00",
        "toNodeId": "v3_line_04_p01",
        "lengthMeters": 24.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_04_s01",
        "fromNodeId": "v3_line_04_p01",
        "toNodeId": "v3_line_04_p02",
        "lengthMeters": 95.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_04_s02",
        "fromNodeId": "v3_line_04_p02",
        "toNodeId": "v3_line_04_p03",
        "lengthMeters": 75.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_05_s00",
        "fromNodeId": "v3_line_05_p00",
        "toNodeId": "v3_line_05_p01",
        "lengthMeters": 202.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_05_s01",
        "fromNodeId": "v3_line_05_p01",
        "toNodeId": "v3_line_05_p02",
        "lengthMeters": 237.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_05_s02",
        "fromNodeId": "v3_line_05_p02",
        "toNodeId": "v3_line_05_p03",
        "lengthMeters": 209.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_05_s03",
        "fromNodeId": "v3_line_05_p03",
        "toNodeId": "v3_line_05_p04",
        "lengthMeters": 206.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_05_s04",
        "fromNodeId": "v3_line_05_p04",
        "toNodeId": "v3_line_05_p05",
        "lengthMeters": 111.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_05_s05",
        "fromNodeId": "v3_line_05_p05",
        "toNodeId": "v3_line_05_p06",
        "lengthMeters": 51,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_05_s06",
        "fromNodeId": "v3_line_05_p06",
        "toNodeId": "v3_line_05_p07",
        "lengthMeters": 190.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_06_s00",
        "fromNodeId": "v3_line_06_p00",
        "toNodeId": "v3_line_06_p01",
        "lengthMeters": 22.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_06_s01",
        "fromNodeId": "v3_line_06_p01",
        "toNodeId": "v3_line_06_p02",
        "lengthMeters": 156.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_06_s02",
        "fromNodeId": "v3_line_06_p02",
        "toNodeId": "v3_line_06_p03",
        "lengthMeters": 56.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_07_s00",
        "fromNodeId": "v3_line_07_p00",
        "toNodeId": "v3_line_07_p01",
        "lengthMeters": 41,
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
        "lengthMeters": 24.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_08_s01",
        "fromNodeId": "v3_line_08_p01",
        "toNodeId": "v3_line_08_p02",
        "lengthMeters": 145.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_08_s02",
        "fromNodeId": "v3_line_08_p02",
        "toNodeId": "v3_line_08_p03",
        "lengthMeters": 59.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_09_s00",
        "fromNodeId": "v3_line_09_p00",
        "toNodeId": "v3_line_09_p01",
        "lengthMeters": 41.2,
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
        "lengthMeters": 23,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_10_s01",
        "fromNodeId": "v3_line_10_p01",
        "toNodeId": "v3_line_10_p02",
        "lengthMeters": 34.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_10_s02",
        "fromNodeId": "v3_line_10_p02",
        "toNodeId": "v3_line_10_p03",
        "lengthMeters": 47.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_10_s03",
        "fromNodeId": "v3_line_10_p03",
        "toNodeId": "v3_line_10_p04",
        "lengthMeters": 28.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_11_s00",
        "fromNodeId": "v3_line_11_p00",
        "toNodeId": "v3_line_11_p01",
        "lengthMeters": 28.3,
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
        "lengthMeters": 23.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_12_s01",
        "fromNodeId": "v3_line_12_p01",
        "toNodeId": "v3_line_12_p02",
        "lengthMeters": 83.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_12_s02",
        "fromNodeId": "v3_line_12_p02",
        "toNodeId": "v3_line_12_p03",
        "lengthMeters": 198.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_12_s03",
        "fromNodeId": "v3_line_12_p03",
        "toNodeId": "v3_line_12_p04",
        "lengthMeters": 199.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_13_s00",
        "fromNodeId": "v3_line_13_p00",
        "toNodeId": "v3_line_13_p01",
        "lengthMeters": 30,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_13_s01",
        "fromNodeId": "v3_line_13_p01",
        "toNodeId": "v3_line_13_p02",
        "lengthMeters": 93.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_13_s02",
        "fromNodeId": "v3_line_13_p02",
        "toNodeId": "v3_line_13_p03",
        "lengthMeters": 30.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_15_s00",
        "fromNodeId": "v3_line_15_p00",
        "toNodeId": "v3_line_15_p01",
        "lengthMeters": 21.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_16_s00",
        "fromNodeId": "v3_line_16_p00",
        "toNodeId": "v3_line_16_p01",
        "lengthMeters": 28,
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
        "lengthMeters": 45.6,
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
        "lengthMeters": 26.4,
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
        "lengthMeters": 34,
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
        "lengthMeters": 22,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s01",
        "fromNodeId": "v3_line_17_p01",
        "toNodeId": "v3_line_17_p02",
        "lengthMeters": 69.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s02",
        "fromNodeId": "v3_line_17_p02",
        "toNodeId": "v3_line_17_p03",
        "lengthMeters": 16.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s03",
        "fromNodeId": "v3_line_17_p03",
        "toNodeId": "v3_line_17_p04",
        "lengthMeters": 21,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s04",
        "fromNodeId": "v3_line_17_p04",
        "toNodeId": "v3_line_17_p05",
        "lengthMeters": 209.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s05",
        "fromNodeId": "v3_line_17_p05",
        "toNodeId": "v3_line_17_p06",
        "lengthMeters": 131.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s06",
        "fromNodeId": "v3_line_17_p06",
        "toNodeId": "v3_line_17_p07",
        "lengthMeters": 298.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s07",
        "fromNodeId": "v3_line_17_p07",
        "toNodeId": "v3_line_17_p08",
        "lengthMeters": 26.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s08",
        "fromNodeId": "v3_line_17_p08",
        "toNodeId": "v3_line_17_p09",
        "lengthMeters": 63.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s09",
        "fromNodeId": "v3_line_17_p09",
        "toNodeId": "v3_line_17_p10",
        "lengthMeters": 26.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s10",
        "fromNodeId": "v3_line_17_p10",
        "toNodeId": "v3_line_17_p11",
        "lengthMeters": 252,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s11",
        "fromNodeId": "v3_line_17_p11",
        "toNodeId": "v3_line_17_p12",
        "lengthMeters": 24.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s12",
        "fromNodeId": "v3_line_17_p12",
        "toNodeId": "v3_line_17_p13",
        "lengthMeters": 85.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s13",
        "fromNodeId": "v3_line_17_p13",
        "toNodeId": "v3_line_17_p14",
        "lengthMeters": 105.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s14",
        "fromNodeId": "v3_line_17_p14",
        "toNodeId": "v3_line_17_p15",
        "lengthMeters": 18,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_17_s15",
        "fromNodeId": "v3_line_17_p15",
        "toNodeId": "v3_line_17_p16",
        "lengthMeters": 48.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_18_s00",
        "fromNodeId": "v3_line_18_p00",
        "toNodeId": "v3_line_18_p01",
        "lengthMeters": 23.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_18_s01",
        "fromNodeId": "v3_line_18_p01",
        "toNodeId": "v3_line_18_p02",
        "lengthMeters": 43.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_18_s02",
        "fromNodeId": "v3_line_18_p02",
        "toNodeId": "v3_line_18_p03",
        "lengthMeters": 68.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_19_s00",
        "fromNodeId": "v3_line_19_p00",
        "toNodeId": "v3_line_19_p01",
        "lengthMeters": 24.4,
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
        "lengthMeters": 85.2,
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
        "lengthMeters": 30.8,
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
        "lengthMeters": 36.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_22_s00",
        "fromNodeId": "v3_line_22_p00",
        "toNodeId": "v3_line_22_p01",
        "lengthMeters": 37.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_23_s00",
        "fromNodeId": "v3_line_23_p00",
        "toNodeId": "v3_line_23_p01",
        "lengthMeters": 37.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_24_s00",
        "fromNodeId": "v3_line_24_p00",
        "toNodeId": "v3_line_24_p01",
        "lengthMeters": 37.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_25_s00",
        "fromNodeId": "v3_line_25_p00",
        "toNodeId": "v3_line_25_p01",
        "lengthMeters": 33.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_26_s00",
        "fromNodeId": "v3_line_26_p00",
        "toNodeId": "v3_line_26_p01",
        "lengthMeters": 24.1,
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
        "lengthMeters": 47,
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
        "lengthMeters": 68.5,
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
        "lengthMeters": 42,
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
        "lengthMeters": 41.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_28_s00",
        "fromNodeId": "v3_line_28_p00",
        "toNodeId": "v3_line_28_p01",
        "lengthMeters": 39.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_29_s00",
        "fromNodeId": "v3_line_29_p00",
        "toNodeId": "v3_line_29_p01",
        "lengthMeters": 39.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_30_s00",
        "fromNodeId": "v3_line_30_p00",
        "toNodeId": "v3_line_30_p01",
        "lengthMeters": 33.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_31_s00",
        "fromNodeId": "v3_line_31_p00",
        "toNodeId": "v3_line_31_p01",
        "lengthMeters": 35,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_32_s00",
        "fromNodeId": "v3_line_32_p00",
        "toNodeId": "v3_line_32_p01",
        "lengthMeters": 29.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_33_s00",
        "fromNodeId": "v3_line_33_p00",
        "toNodeId": "v3_line_33_p01",
        "lengthMeters": 31.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_34_s00",
        "fromNodeId": "v3_line_34_p00",
        "toNodeId": "v3_line_34_p01",
        "lengthMeters": 67.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_34_s01",
        "fromNodeId": "v3_line_34_p01",
        "toNodeId": "v3_line_34_p02",
        "lengthMeters": 37,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_35_s00",
        "fromNodeId": "v3_line_35_p00",
        "toNodeId": "v3_line_35_p01",
        "lengthMeters": 27.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_36_s00",
        "fromNodeId": "v3_line_36_p00",
        "toNodeId": "v3_line_36_p01",
        "lengthMeters": 28.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_37_s00",
        "fromNodeId": "v3_line_37_p00",
        "toNodeId": "v3_line_37_p01",
        "lengthMeters": 45,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_38_s00",
        "fromNodeId": "v3_line_38_p00",
        "toNodeId": "v3_line_38_p01",
        "lengthMeters": 38,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_39_s00",
        "fromNodeId": "v3_line_39_p00",
        "toNodeId": "v3_line_39_p01",
        "lengthMeters": 9.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_40_s00",
        "fromNodeId": "v3_line_40_p00",
        "toNodeId": "v3_line_40_p01",
        "lengthMeters": 13.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_41_s00",
        "fromNodeId": "v3_line_41_p00",
        "toNodeId": "v3_line_41_p01",
        "lengthMeters": 15.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_42_s00",
        "fromNodeId": "v3_line_42_p00",
        "toNodeId": "v3_line_42_p01",
        "lengthMeters": 5.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_43_s00",
        "fromNodeId": "v3_line_43_p00",
        "toNodeId": "v3_line_43_p01",
        "lengthMeters": 18.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_45_s00",
        "fromNodeId": "v3_line_45_p00",
        "toNodeId": "v3_line_45_p01",
        "lengthMeters": 4.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_46_s00",
        "fromNodeId": "v3_line_46_p00",
        "toNodeId": "v3_line_46_p01",
        "lengthMeters": 31.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_47_s00",
        "fromNodeId": "v3_line_47_p00",
        "toNodeId": "v3_line_47_p01",
        "lengthMeters": 15.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_50_s00",
        "fromNodeId": "v3_line_50_p00",
        "toNodeId": "v3_line_50_p01",
        "lengthMeters": 11.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_51_s00",
        "fromNodeId": "v3_line_51_p00",
        "toNodeId": "v3_line_51_p01",
        "lengthMeters": 17.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_52_s00",
        "fromNodeId": "v3_line_52_p00",
        "toNodeId": "v3_line_52_p01",
        "lengthMeters": 43.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_53_s00",
        "fromNodeId": "v3_line_53_p00",
        "toNodeId": "v3_line_53_p01",
        "lengthMeters": 6.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_line_55_s00",
        "fromNodeId": "v3_line_55_p00",
        "toNodeId": "v3_line_55_p01",
        "lengthMeters": 22,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J01",
        "fromNodeId": "v3_line_19_p02",
        "toNodeId": "v3_line_20_p00",
        "lengthMeters": 15,
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
        "lengthMeters": 19,
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
        "lengthMeters": 19,
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
        "lengthMeters": 21,
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
        "lengthMeters": 27,
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
        "lengthMeters": 30.2,
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
        "lengthMeters": 30.2,
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
        "lengthMeters": 33,
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
        "lengthMeters": 33,
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
        "lengthMeters": 12,
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
        "lengthMeters": 15,
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
        "lengthMeters": 21,
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
        "lengthMeters": 43,
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
        "lengthMeters": 47,
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
    },
    {
        "id": "v3_junction_J42",
        "fromNodeId": "v3_line_09_p01",
        "toNodeId": "v3_line_26_p00",
        "lengthMeters": 78.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J43",
        "fromNodeId": "v3_line_13_p03",
        "toNodeId": "v3_line_21_p00",
        "lengthMeters": 89.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J44",
        "fromNodeId": "v3_line_35_p01",
        "toNodeId": "v3_line_38_p01",
        "lengthMeters": 51.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J45",
        "fromNodeId": "v3_line_35_p01",
        "toNodeId": "v3_line_36_p01",
        "lengthMeters": 63.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J46",
        "fromNodeId": "v3_line_37_p01",
        "toNodeId": "v3_line_38_p01",
        "lengthMeters": 64.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J47",
        "fromNodeId": "v3_line_35_p00",
        "toNodeId": "v3_line_37_p01",
        "lengthMeters": 74.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J48",
        "fromNodeId": "v3_line_34_p00",
        "toNodeId": "v3_line_37_p01",
        "lengthMeters": 75.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J49",
        "fromNodeId": "v3_line_13_p03",
        "toNodeId": "v3_line_15_p01",
        "lengthMeters": 76.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J50",
        "fromNodeId": "v3_line_36_p01",
        "toNodeId": "v3_line_37_p01",
        "lengthMeters": 76.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J51",
        "fromNodeId": "v3_line_03_p01",
        "toNodeId": "v3_line_17_p00",
        "lengthMeters": 81.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J52",
        "fromNodeId": "v3_line_03_p01",
        "toNodeId": "v3_line_05_p00",
        "lengthMeters": 81.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J53",
        "fromNodeId": "v3_line_36_p00",
        "toNodeId": "v3_line_38_p01",
        "lengthMeters": 86.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J54",
        "fromNodeId": "v3_line_30_p01",
        "toNodeId": "v3_line_31_p01",
        "lengthMeters": 87.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J55",
        "fromNodeId": "v3_line_34_p00",
        "toNodeId": "v3_line_35_p01",
        "lengthMeters": 87.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J56",
        "fromNodeId": "v3_line_10_p04",
        "toNodeId": "v3_line_11_p01",
        "lengthMeters": 88.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J57",
        "fromNodeId": "v3_line_07_p01",
        "toNodeId": "v3_line_12_p00",
        "lengthMeters": 90.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J58",
        "fromNodeId": "v3_line_10_p04",
        "toNodeId": "v3_line_11_p00",
        "lengthMeters": 98.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J59",
        "fromNodeId": "v3_line_19_p03",
        "toNodeId": "v3_line_20_p00",
        "lengthMeters": 99.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J60",
        "fromNodeId": "v3_line_28_p00",
        "toNodeId": "v3_line_30_p00",
        "lengthMeters": 105.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J61",
        "fromNodeId": "v3_line_29_p00",
        "toNodeId": "v3_line_31_p00",
        "lengthMeters": 106.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J62",
        "fromNodeId": "v3_line_22_p00",
        "toNodeId": "v3_line_23_p00",
        "lengthMeters": 107.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J63",
        "fromNodeId": "v3_line_29_p00",
        "toNodeId": "v3_line_30_p01",
        "lengthMeters": 108.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J64",
        "fromNodeId": "v3_line_23_p00",
        "toNodeId": "v3_line_24_p00",
        "lengthMeters": 113.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J65",
        "fromNodeId": "v3_line_32_p01",
        "toNodeId": "v3_line_33_p01",
        "lengthMeters": 114,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J66",
        "fromNodeId": "v3_line_36_p01",
        "toNodeId": "v3_line_38_p00",
        "lengthMeters": 115,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J67",
        "fromNodeId": "v3_line_28_p00",
        "toNodeId": "v3_line_31_p01",
        "lengthMeters": 117.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J68",
        "fromNodeId": "v3_line_24_p00",
        "toNodeId": "v3_line_25_p00",
        "lengthMeters": 119.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J69",
        "fromNodeId": "v3_line_29_p01",
        "toNodeId": "v3_line_31_p01",
        "lengthMeters": 120.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J70",
        "fromNodeId": "v3_line_08_p03",
        "toNodeId": "v3_line_09_p01",
        "lengthMeters": 120.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J71",
        "fromNodeId": "v3_line_29_p00",
        "toNodeId": "v3_line_32_p01",
        "lengthMeters": 120.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J72",
        "fromNodeId": "v3_line_21_p00",
        "toNodeId": "v3_line_22_p00",
        "lengthMeters": 122.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J73",
        "fromNodeId": "v3_line_28_p01",
        "toNodeId": "v3_line_30_p01",
        "lengthMeters": 124.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J74",
        "fromNodeId": "v3_line_05_p00",
        "toNodeId": "v3_line_17_p00",
        "lengthMeters": 126.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J75",
        "fromNodeId": "v3_line_35_p01",
        "toNodeId": "v3_line_37_p00",
        "lengthMeters": 126.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J76",
        "fromNodeId": "v3_line_15_p01",
        "toNodeId": "v3_line_22_p01",
        "lengthMeters": 129,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J77",
        "fromNodeId": "v3_line_27_p00",
        "toNodeId": "v3_line_28_p00",
        "lengthMeters": 129.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J78",
        "fromNodeId": "v3_line_06_p03",
        "toNodeId": "v3_line_07_p01",
        "lengthMeters": 130.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J79",
        "fromNodeId": "v3_line_13_p03",
        "toNodeId": "v3_line_22_p01",
        "lengthMeters": 134.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J80",
        "fromNodeId": "v3_line_07_p00",
        "toNodeId": "v3_line_12_p00",
        "lengthMeters": 135.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J81",
        "fromNodeId": "v3_line_09_p00",
        "toNodeId": "v3_line_13_p00",
        "lengthMeters": 135.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J82",
        "fromNodeId": "v3_line_28_p00",
        "toNodeId": "v3_line_29_p00",
        "lengthMeters": 138.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J83",
        "fromNodeId": "v3_line_34_p00",
        "toNodeId": "v3_line_38_p01",
        "lengthMeters": 138.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J84",
        "fromNodeId": "v3_line_31_p01",
        "toNodeId": "v3_line_32_p01",
        "lengthMeters": 141.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J85",
        "fromNodeId": "v3_line_13_p03",
        "toNodeId": "v3_line_23_p00",
        "lengthMeters": 143.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J86",
        "fromNodeId": "v3_line_34_p00",
        "toNodeId": "v3_line_12_p04",
        "lengthMeters": 195.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J200",
        "fromNodeId": "v3_line_39_p00",
        "toNodeId": "v3_line_01_p00",
        "lengthMeters": 9.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J201",
        "fromNodeId": "v3_line_39_p01",
        "toNodeId": "v3_line_01_p00",
        "lengthMeters": 10,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J202",
        "fromNodeId": "v3_line_39_p00",
        "toNodeId": "v3_line_03_p00",
        "lengthMeters": 8.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J203",
        "fromNodeId": "v3_line_39_p01",
        "toNodeId": "v3_line_03_p00",
        "lengthMeters": 1.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J204",
        "fromNodeId": "v3_line_40_p00",
        "toNodeId": "v3_line_01_p01",
        "lengthMeters": 6.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J205",
        "fromNodeId": "v3_line_40_p01",
        "toNodeId": "v3_line_01_p01",
        "lengthMeters": 11,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J206",
        "fromNodeId": "v3_line_40_p00",
        "toNodeId": "v3_line_04_p00",
        "lengthMeters": 13,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J207",
        "fromNodeId": "v3_line_40_p01",
        "toNodeId": "v3_line_04_p00",
        "lengthMeters": 1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J208",
        "fromNodeId": "v3_line_40_p01",
        "toNodeId": "v3_line_04_p01",
        "lengthMeters": 23.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J209",
        "fromNodeId": "v3_line_41_p00",
        "toNodeId": "v3_line_03_p01",
        "lengthMeters": 2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J210",
        "fromNodeId": "v3_line_41_p01",
        "toNodeId": "v3_line_03_p01",
        "lengthMeters": 17,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J211",
        "fromNodeId": "v3_line_41_p00",
        "toNodeId": "v3_line_05_p00",
        "lengthMeters": 28.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J212",
        "fromNodeId": "v3_line_41_p01",
        "toNodeId": "v3_line_05_p00",
        "lengthMeters": 26.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J213",
        "fromNodeId": "v3_line_41_p00",
        "toNodeId": "v3_line_16_p00",
        "lengthMeters": 14.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J214",
        "fromNodeId": "v3_line_41_p01",
        "toNodeId": "v3_line_16_p00",
        "lengthMeters": 4.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J215",
        "fromNodeId": "v3_line_41_p01",
        "toNodeId": "v3_line_16_p01",
        "lengthMeters": 29.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J216",
        "fromNodeId": "v3_line_41_p00",
        "toNodeId": "v3_line_17_p00",
        "lengthMeters": 25.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J217",
        "fromNodeId": "v3_line_41_p01",
        "toNodeId": "v3_line_17_p00",
        "lengthMeters": 15.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J218",
        "fromNodeId": "v3_line_41_p01",
        "toNodeId": "v3_line_17_p01",
        "lengthMeters": 22.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J219",
        "fromNodeId": "v3_line_41_p00",
        "toNodeId": "v3_line_42_p00",
        "lengthMeters": 25.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J220",
        "fromNodeId": "v3_line_41_p01",
        "toNodeId": "v3_line_42_p00",
        "lengthMeters": 15.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J221",
        "fromNodeId": "v3_line_41_p00",
        "toNodeId": "v3_line_42_p01",
        "lengthMeters": 26.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J222",
        "fromNodeId": "v3_line_41_p01",
        "toNodeId": "v3_line_42_p01",
        "lengthMeters": 19.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J223",
        "fromNodeId": "v3_line_41_p00",
        "toNodeId": "v3_line_52_p00",
        "lengthMeters": 1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J224",
        "fromNodeId": "v3_line_41_p01",
        "toNodeId": "v3_line_52_p00",
        "lengthMeters": 16.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J225",
        "fromNodeId": "v3_line_41_p00",
        "toNodeId": "v3_line_53_p00",
        "lengthMeters": 27.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J226",
        "fromNodeId": "v3_line_41_p01",
        "toNodeId": "v3_line_53_p00",
        "lengthMeters": 17.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J227",
        "fromNodeId": "v3_line_41_p00",
        "toNodeId": "v3_line_53_p01",
        "lengthMeters": 28.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J228",
        "fromNodeId": "v3_line_41_p01",
        "toNodeId": "v3_line_53_p01",
        "lengthMeters": 22,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J229",
        "fromNodeId": "v3_line_42_p00",
        "toNodeId": "v3_line_03_p01",
        "lengthMeters": 27.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J230",
        "fromNodeId": "v3_line_42_p01",
        "toNodeId": "v3_line_03_p01",
        "lengthMeters": 28.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J231",
        "fromNodeId": "v3_line_42_p00",
        "toNodeId": "v3_line_16_p00",
        "lengthMeters": 19.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J232",
        "fromNodeId": "v3_line_42_p01",
        "toNodeId": "v3_line_16_p00",
        "lengthMeters": 23.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J233",
        "fromNodeId": "v3_line_42_p00",
        "toNodeId": "v3_line_17_p00",
        "lengthMeters": 0,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J234",
        "fromNodeId": "v3_line_42_p01",
        "toNodeId": "v3_line_17_p00",
        "lengthMeters": 5.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J235",
        "fromNodeId": "v3_line_42_p00",
        "toNodeId": "v3_line_17_p01",
        "lengthMeters": 22,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J236",
        "fromNodeId": "v3_line_42_p01",
        "toNodeId": "v3_line_17_p01",
        "lengthMeters": 27.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J237",
        "fromNodeId": "v3_line_42_p00",
        "toNodeId": "v3_line_52_p00",
        "lengthMeters": 26.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J238",
        "fromNodeId": "v3_line_42_p01",
        "toNodeId": "v3_line_52_p00",
        "lengthMeters": 27.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J239",
        "fromNodeId": "v3_line_42_p00",
        "toNodeId": "v3_line_53_p00",
        "lengthMeters": 2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J240",
        "fromNodeId": "v3_line_42_p01",
        "toNodeId": "v3_line_53_p00",
        "lengthMeters": 5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J241",
        "fromNodeId": "v3_line_42_p00",
        "toNodeId": "v3_line_53_p01",
        "lengthMeters": 7.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J242",
        "fromNodeId": "v3_line_42_p01",
        "toNodeId": "v3_line_53_p01",
        "lengthMeters": 2.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J243",
        "fromNodeId": "v3_line_43_p00",
        "toNodeId": "v3_line_04_p03",
        "lengthMeters": 0,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J244",
        "fromNodeId": "v3_line_43_p01",
        "toNodeId": "v3_line_04_p03",
        "lengthMeters": 18.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J245",
        "fromNodeId": "v3_line_43_p00",
        "toNodeId": "v3_line_05_p01",
        "lengthMeters": 17.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J246",
        "fromNodeId": "v3_line_43_p01",
        "toNodeId": "v3_line_05_p01",
        "lengthMeters": 2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J247",
        "fromNodeId": "v3_line_43_p00",
        "toNodeId": "v3_line_18_p00",
        "lengthMeters": 18.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J248",
        "fromNodeId": "v3_line_43_p01",
        "toNodeId": "v3_line_18_p00",
        "lengthMeters": 3.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J249",
        "fromNodeId": "v3_line_43_p01",
        "toNodeId": "v3_line_18_p01",
        "lengthMeters": 22.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J250",
        "fromNodeId": "v3_line_45_p00",
        "toNodeId": "v3_line_05_p02",
        "lengthMeters": 6.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J251",
        "fromNodeId": "v3_line_45_p01",
        "toNodeId": "v3_line_05_p02",
        "lengthMeters": 5.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J252",
        "fromNodeId": "v3_line_45_p00",
        "toNodeId": "v3_line_10_p00",
        "lengthMeters": 2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J253",
        "fromNodeId": "v3_line_45_p01",
        "toNodeId": "v3_line_10_p00",
        "lengthMeters": 4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J254",
        "fromNodeId": "v3_line_45_p00",
        "toNodeId": "v3_line_10_p01",
        "lengthMeters": 23.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J255",
        "fromNodeId": "v3_line_45_p01",
        "toNodeId": "v3_line_10_p01",
        "lengthMeters": 27,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J256",
        "fromNodeId": "v3_line_46_p00",
        "toNodeId": "v3_line_17_p07",
        "lengthMeters": 29.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J257",
        "fromNodeId": "v3_line_46_p01",
        "toNodeId": "v3_line_17_p07",
        "lengthMeters": 27.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J258",
        "fromNodeId": "v3_line_46_p01",
        "toNodeId": "v3_line_17_p08",
        "lengthMeters": 1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J259",
        "fromNodeId": "v3_line_46_p00",
        "toNodeId": "v3_line_19_p02",
        "lengthMeters": 4.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J260",
        "fromNodeId": "v3_line_46_p01",
        "toNodeId": "v3_line_19_p02",
        "lengthMeters": 27.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J261",
        "fromNodeId": "v3_line_46_p00",
        "toNodeId": "v3_line_20_p00",
        "lengthMeters": 2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J262",
        "fromNodeId": "v3_line_47_p00",
        "toNodeId": "v3_line_13_p02",
        "lengthMeters": 26.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J263",
        "fromNodeId": "v3_line_47_p00",
        "toNodeId": "v3_line_13_p03",
        "lengthMeters": 4.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J264",
        "fromNodeId": "v3_line_47_p01",
        "toNodeId": "v3_line_13_p03",
        "lengthMeters": 12.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J265",
        "fromNodeId": "v3_line_47_p00",
        "toNodeId": "v3_line_15_p00",
        "lengthMeters": 18.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J266",
        "fromNodeId": "v3_line_47_p00",
        "toNodeId": "v3_line_15_p01",
        "lengthMeters": 26,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J267",
        "fromNodeId": "v3_line_47_p01",
        "toNodeId": "v3_line_21_p00",
        "lengthMeters": 17.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J268",
        "fromNodeId": "v3_line_47_p00",
        "toNodeId": "v3_line_22_p00",
        "lengthMeters": 16.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J269",
        "fromNodeId": "v3_line_47_p01",
        "toNodeId": "v3_line_22_p00",
        "lengthMeters": 23.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J270",
        "fromNodeId": "v3_line_50_p00",
        "toNodeId": "v3_line_05_p07",
        "lengthMeters": 10,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J271",
        "fromNodeId": "v3_line_50_p01",
        "toNodeId": "v3_line_05_p07",
        "lengthMeters": 1.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J272",
        "fromNodeId": "v3_line_50_p00",
        "toNodeId": "v3_line_17_p16",
        "lengthMeters": 2.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J273",
        "fromNodeId": "v3_line_50_p01",
        "toNodeId": "v3_line_17_p16",
        "lengthMeters": 9.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J274",
        "fromNodeId": "v3_line_51_p00",
        "toNodeId": "v3_line_05_p04",
        "lengthMeters": 21.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J275",
        "fromNodeId": "v3_line_51_p01",
        "toNodeId": "v3_line_05_p04",
        "lengthMeters": 8.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J276",
        "fromNodeId": "v3_line_51_p00",
        "toNodeId": "v3_line_06_p03",
        "lengthMeters": 17.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J277",
        "fromNodeId": "v3_line_51_p01",
        "toNodeId": "v3_line_06_p03",
        "lengthMeters": 1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J278",
        "fromNodeId": "v3_line_51_p00",
        "toNodeId": "v3_line_12_p00",
        "lengthMeters": 23.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J279",
        "fromNodeId": "v3_line_51_p01",
        "toNodeId": "v3_line_12_p00",
        "lengthMeters": 14.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J280",
        "fromNodeId": "v3_line_51_p00",
        "toNodeId": "v3_line_12_p01",
        "lengthMeters": 1.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J281",
        "fromNodeId": "v3_line_51_p01",
        "toNodeId": "v3_line_12_p01",
        "lengthMeters": 18.7,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J282",
        "fromNodeId": "v3_line_52_p00",
        "toNodeId": "v3_line_03_p01",
        "lengthMeters": 1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J283",
        "fromNodeId": "v3_line_52_p00",
        "toNodeId": "v3_line_05_p00",
        "lengthMeters": 27.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J284",
        "fromNodeId": "v3_line_52_p01",
        "toNodeId": "v3_line_05_p00",
        "lengthMeters": 26.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J285",
        "fromNodeId": "v3_line_52_p00",
        "toNodeId": "v3_line_16_p00",
        "lengthMeters": 15.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J286",
        "fromNodeId": "v3_line_52_p01",
        "toNodeId": "v3_line_16_p00",
        "lengthMeters": 29,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J287",
        "fromNodeId": "v3_line_52_p01",
        "toNodeId": "v3_line_16_p01",
        "lengthMeters": 1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J288",
        "fromNodeId": "v3_line_52_p00",
        "toNodeId": "v3_line_17_p00",
        "lengthMeters": 26.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J289",
        "fromNodeId": "v3_line_52_p01",
        "toNodeId": "v3_line_17_p01",
        "lengthMeters": 23.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J290",
        "fromNodeId": "v3_line_52_p00",
        "toNodeId": "v3_line_53_p00",
        "lengthMeters": 28.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J291",
        "fromNodeId": "v3_line_52_p00",
        "toNodeId": "v3_line_53_p01",
        "lengthMeters": 29.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J292",
        "fromNodeId": "v3_line_53_p00",
        "toNodeId": "v3_line_03_p01",
        "lengthMeters": 29.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J293",
        "fromNodeId": "v3_line_53_p00",
        "toNodeId": "v3_line_16_p00",
        "lengthMeters": 21.8,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J294",
        "fromNodeId": "v3_line_53_p01",
        "toNodeId": "v3_line_16_p00",
        "lengthMeters": 25.9,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J295",
        "fromNodeId": "v3_line_53_p00",
        "toNodeId": "v3_line_17_p00",
        "lengthMeters": 2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J296",
        "fromNodeId": "v3_line_53_p01",
        "toNodeId": "v3_line_17_p00",
        "lengthMeters": 7.2,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J297",
        "fromNodeId": "v3_line_53_p00",
        "toNodeId": "v3_line_17_p01",
        "lengthMeters": 22.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J298",
        "fromNodeId": "v3_line_53_p01",
        "toNodeId": "v3_line_17_p01",
        "lengthMeters": 28.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J299",
        "fromNodeId": "v3_line_55_p00",
        "toNodeId": "v3_line_05_p05",
        "lengthMeters": 4.1,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J300",
        "fromNodeId": "v3_line_55_p01",
        "toNodeId": "v3_line_05_p05",
        "lengthMeters": 23.3,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J301",
        "fromNodeId": "v3_line_55_p00",
        "toNodeId": "v3_line_08_p03",
        "lengthMeters": 1.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J302",
        "fromNodeId": "v3_line_55_p01",
        "toNodeId": "v3_line_08_p03",
        "lengthMeters": 21,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J303",
        "fromNodeId": "v3_line_55_p00",
        "toNodeId": "v3_line_13_p00",
        "lengthMeters": 14.6,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J304",
        "fromNodeId": "v3_line_55_p01",
        "toNodeId": "v3_line_13_p00",
        "lengthMeters": 29.5,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J305",
        "fromNodeId": "v3_line_55_p00",
        "toNodeId": "v3_line_13_p01",
        "lengthMeters": 23,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    },
    {
        "id": "v3_junction_J306",
        "fromNodeId": "v3_line_55_p01",
        "toNodeId": "v3_line_13_p01",
        "lengthMeters": 1.4,
        "maxSpeedKts": 15,
        "type": "taxiway",
        "bidirectional": true,
        "status": "open",
        "trafficLevel": "low"
    }
]
};
