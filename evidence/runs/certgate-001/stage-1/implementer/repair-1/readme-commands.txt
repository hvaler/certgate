$ docker build --no-cache -t certgate .
(ran above as docker-build-no-cache.txt with tag certgate)
$ docker run --rm -d --name certgate -p 3000:3000 -e PORT=3000 certgate
9acbada3fa89870c01c707134972351d5c7844f897dfcd9210e4a17dc3ae4132
[exit 0]
$ curl -X POST http://localhost:3000/api/cases/cg-003/process
  % Total    % Received % Xferd  Average Speed  Time    Time    Time   Current
                                 Dload  Upload  Total   Spent   Left   Speed
  0      0   0      0   0      0      0      0                              0{
  "summary": {
    "case_id": "cg-003",
    "status": "processed",
    "proposal": "review",
    "human_required": true,
    "reading_source": "mock",
    "reasons": [
      "CRITICAL_UNKNOWN:ReH",
      "NO_SECOND_CHANNEL",
      "RULE_NOT_EVALUABLE:ReH"
    ],
    "human_confirmation_required": [
      "certificate_type",
      "heat_or_lot",
      "grade",
      "cev_printed",
      "kv_temperature",
      "inspection_stamp",
      "chemistry.C",
      "chemistry.Si",
      "chemistry.Mn",
      "chemistry.P",
      "chemistry.S",
      "chemistry.Cr",
      "chemistry.Ni",
      "chemistry.Mo",
      "chemistry.Cu",
      "chemistry.V",
      "mechanical.ReH",
      "mechanical.Rm",
      "mechanical.A",
      "mechanical.KV_1",
      "mechanical.KV_2",
      "mechanical.KV_3"
    ],
    "note": "CertGate only proposes. A person decides. All data is fictitious. The reading is MOCK (no model)."
  },
  "receipt": {
    "receipt_schema": "certgate.receipt/1",
    "case_id": "cg-003",
    "run_id": "a64235e6-7ec6-48cc-93e8-2899e12134a3",
    "created_at": "2026-10-12T17:58:47.873Z",
    "mode": "mock",
    "reading_source": "mock",
    "reader": {
      "reader_id": "mock-reader",
      "reading_source": "mock",
      "model_id": "MOCK (no model; dataset reading)",
      "model_version": "not applicable (mock)",
      "vllm_version": "not applicable (mock)",
      "rocm_version": "not applicable (mock)",
      "calls": "1"
    },
    "planted": [],
    "status": "processed",
    "proposal": "review",
    "reasons": [
      {
        "code": "CRITICAL_UNKNOWN:ReH",
        "effect": "review",
        "detail": "mechanical.ReH could not be read with confidence"
      },
      {
        "code": "NO_SECOND_CHANNEL",
        "effect": "review",
        "detail": "no text layer: 22 critical field(s) need human confirmation"
      },
      {
        "code": "RULE_NOT_EVALUABLE:ReH",
        "effect": "review",
        "detail": "mechanical.ReH unknown"
      }
    ],
    "human_required": true,
    "human_confirmation_required": [
      "certificate_type",
      "heat_or_lot",
      "grade",
      "cev_printed",
      "kv_temperature",
      "inspection_stamp",
      "chemistry.C",
      "chemistry.Si",
      "chemistry.Mn",
      "chemistry.P",
      "chemistry.S",
      "chemistry.Cr",
      "chemistry.Ni",
      "chemistry.Mo",
      "chemistry.Cu",
      "chemistry.V",
      "mechanical.ReH",
      "mechanical.Rm",
      "mechanical.A",
      "mechanical.KV_1",
      "mechanical.KV_2",
      "mechanical.KV_3"
    ],
    "human_decision": null,
    "confirmations": [],
    "channel_available": false,
    "timings_ms": {
      "validate": "77.221",
      "text_layer": "0.202",
      "model_reading": "0.295",
      "evaluation": "1.533"
    },
    "errors": [],
    "hashes": {
      "certificate_sha256": "40899aa26ccec1e0a2e62d63a7abac8098ee0debc38df7c7b7ea121ac3619c01",
      "certificate_size": "161559",
      "delivery_note_sha256": "15a7247a6c1c2bc55894f5c2a633b5282b784b4ef0d0c6cad2b09bf40f643fe3",
      "model_output_sha256": "f677045deff58fb24a789cb75d5caa5017077b80bc2a5fe7f2dbd7bd0ca787bd",
      "spec_sha256": "2e949172707428a69e046b256ee0374203d30a3b64e139fd062db8bb8337b7c1"
    },
    "rules_version": "certgate-rules-1.0.0",
    "plausibility_version": "plausibility-v1",
    "cev_formula_source": "IIW (Dearden and O'Neill): CEV = C + Mn/6 + (Cr+Mo+V)/5 + (Cu+Ni)/15; cited in docs/sources/cev-formula.md",
    "spec": {
      "spec_id": "ESP-014",
      "revision": "3",
      "grade": "TRN-355"
    },
    "delivery": {
      "delivery_note": "ALB-2026-0917",
      "line": "3"
    },
    "values": [
      {
        "field": "issuer",
        "value": "Siderúrgica Valdemora S.A.",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "certificate_no",
        "value": "SV-2026-118512",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "certificate_type",
        "value": "3.1",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "date",
        "value": "2026-09-19",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "heat_or_lot",
        "value": "24-72015",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "grade",
        "value": "TRN-355",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "dimensions",
        "value": "Chapa 25 x 2000 x 6000 mm",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "cev_printed",
        "value": "0.40",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "kv_temperature",
        "value": "-20",
        "unit": "°C",
        "source": "known (model)"
      },
      {
        "field": "inspection_stamp",
        "value": "QA-07",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "chemistry.C",
        "value": "0.15",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.Si",
        "value": "0.19",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.Mn",
        "value": "1.38",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.P",
        "value": "0.011",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.S",
        "value": "0.005",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.Cr",
        "value": "0.05",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.Ni",
        "value": "0.04",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.Mo",
        "value": "0.01",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.Cu",
        "value": "0.07",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.V",
        "value": "0.002",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "mechanical.ReH",
        "value": null,
        "unit": null,
        "source": "unknown (model)"
      },
      {
        "field": "mechanical.Rm",
        "value": "529",
        "unit": "MPa",
        "source": "known (model)"
      },
      {
        "field": "mechanical.A",
        "value": "27",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "mechanical.KV_1",
        "value": "61",
        "unit": "J",
        "source": "known (model)"
      },
      {
        "field": "mechanical.KV_2",
        "value": "57",
        "unit": "J",
        "source": "known (model)"
      },
      {
        "field": "mechanical.KV_3",
        "value": "66",
        "unit": "J",
        "source": "known (model)"
      }
    ],
    "channel_checks": [
      {
        "field": "certificate_type",
        "model_value": "3.1",
        "model_unit": null,
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "document title"
          }
        ]
      },
      {
        "field": "heat_or_lot",
        "model_value": "24-72015",
        "model_unit": null,
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "Colada / Heat no."
          }
        ]
      },
      {
        "field": "grade",
        "model_value": "TRN-355",
        "model_unit": null,
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "Calidad / Grade"
          }
        ]
      },
      {
        "field": "cev_printed",
        "model_value": "0.40",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column CEV"
          }
        ]
      },
      {
        "field": "kv_temperature",
        "model_value": "-20",
        "model_unit": "°C",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "impact test heading"
          }
        ]
      },
      {
        "field": "inspection_stamp",
        "model_value": "QA-07",
        "model_unit": null,
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "signature block, Sello"
          }
        ]
      },
      {
        "field": "chemistry.C",
        "model_value": "0.15",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column C"
          }
        ]
      },
      {
        "field": "chemistry.Si",
        "model_value": "0.19",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Si"
          }
        ]
      },
      {
        "field": "chemistry.Mn",
        "model_value": "1.38",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Mn"
          }
        ]
      },
      {
        "field": "chemistry.P",
        "model_value": "0.011",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column P"
          }
        ]
      },
      {
        "field": "chemistry.S",
        "model_value": "0.005",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column S"
          }
        ]
      },
      {
        "field": "chemistry.Cr",
        "model_value": "0.05",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Cr"
          }
        ]
      },
      {
        "field": "chemistry.Ni",
        "model_value": "0.04",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Ni"
          }
        ]
      },
      {
        "field": "chemistry.Mo",
        "model_value": "0.01",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Mo"
          }
        ]
      },
      {
        "field": "chemistry.Cu",
        "model_value": "0.07",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Cu"
          }
        ]
      },
      {
        "field": "chemistry.V",
        "model_value": "0.002",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column V"
          }
        ]
      },
      {
        "field": "mechanical.ReH",
        "model_value": null,
        "model_unit": null,
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "mechanical tests table, column ReH"
          }
        ]
      },
      {
        "field": "mechanical.Rm",
        "model_value": "529",
        "model_unit": "MPa",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "mechanical tests table, column Rm"
          }
        ]
      },
      {
        "field": "mechanical.A",
        "model_value": "27",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "mechanical tests table, column A"
          }
        ]
      },
      {
        "field": "mechanical.KV_1",
        "model_value": "61",
        "model_unit": "J",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "impact test table, Probeta 1"
          }
        ]
      },
      {
        "field": "mechanical.KV_2",
        "model_value": "57",
        "model_unit": "J",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "impact test table, Probeta 2"
          }
        ]
      },
      {
        "field": "mechanical.KV_3",
        "model_value": "66",
        "model_unit": "J",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "impact test table, Probeta 3"
          }
        ]
      }
    ],
    "rule_results": [
      {
        "rule_id": "ESP-014.r3.C",
        "input_field_refs": [
          "chemistry.C"
        ],
        "outcome": "pass",
        "expected": "<= 0.20 %",
        "observed": "0.15",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.Si",
        "input_field_refs": [
          "chemistry.Si"
        ],
        "outcome": "pass",
        "expected": "<= 0.55 %",
        "observed": "0.19",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.Mn",
        "input_field_refs": [
          "chemistry.Mn"
        ],
        "outcome": "pass",
        "expected": "<= 1.60 %",
        "observed": "1.38",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.P",
        "input_field_refs": [
          "chemistry.P"
        ],
        "outcome": "pass",
        "expected": "<= 0.025 %",
        "observed": "0.011",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.S",
        "input_field_refs": [
          "chemistry.S"
        ],
        "outcome": "pass",
        "expected": "<= 0.025 %",
        "observed": "0.005",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.Cu",
        "input_field_refs": [
          "chemistry.Cu"
        ],
        "outcome": "pass",
        "expected": "<= 0.55 %",
        "observed": "0.07",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.ReH",
        "input_field_refs": [
          "mechanical.ReH"
        ],
        "outcome": "not_evaluable",
        "expected": ">= 355 MPa",
        "observed": null,
        "reason": "mechanical.ReH unknown"
      },
      {
        "rule_id": "ESP-014.r3.Rm",
        "input_field_refs": [
          "mechanical.Rm"
        ],
        "outcome": "pass",
        "expected": ">= 470 and <= 630 MPa",
        "observed": "529",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.A",
        "input_field_refs": [
          "mechanical.A"
        ],
        "outcome": "pass",
        "expected": ">= 20 %",
        "observed": "27",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.CEV.printed",
        "input_field_refs": [
          "cev_printed"
        ],
        "outcome": "pass",
        "expected": "<= 0.45 %",
        "observed": "0.40",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.CEV.recomputed",
        "input_field_refs": [
          "chemistry.C",
          "chemistry.Mn",
          "chemistry.Cr",
          "chemistry.Mo",
          "chemistry.V",
          "chemistry.Ni",
          "chemistry.Cu"
        ],
        "outcome": "pass",
        "expected": "<= 0.45 %",
        "observed": "100  21383   0  21383   0      0 207.1k      0                              0100  21383   0  21383   0      0 206.8k      0                              0100  21383   0  21383   0      0 206.5k      0                              0
0.39973333333333333333333333333333333333333333333333",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.KV_media",
        "input_field_refs": [
          "mechanical.KV_1",
          "mechanical.KV_2",
          "mechanical.KV_3"
        ],
        "outcome": "pass",
        "expected": "mean of 3 >= 27 J (sum >= 81)",
        "observed": "sum 184",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.grade",
        "input_field_refs": [
          "grade",
          "delivery_line.grade_ordered"
        ],
        "outcome": "pass",
        "expected": "TRN-355 (spec) and TRN-355 (ordered)",
        "observed": "TRN-355",
        "reason": "grade matches"
      }
    ],
    "notice": "All data is fictitious: Siderúrgica Valdemora S.A., Talleres Ribera Norte S.L., grade TRN-355 and spec ESP-014 are invented for this demo."
  }
}
[exit 0]
$ docker stop certgate
certgate
[exit 0]
$ docker run --rm --network none -e PORT=3000 certgate sh -c 'node dist/src/server.js & sleep 2; node -e "fetch(\"http://127.0.0.1:3000/api/cases/cg-003/process\",{method:\"POST\"}).then(r=>r.text()).then(console.log)"'
CertGate listening on port 3000 (mode mock)
{
  "summary": {
    "case_id": "cg-003",
    "status": "processed",
    "proposal": "review",
    "human_required": true,
    "reading_source": "mock",
    "reasons": [
      "CRITICAL_UNKNOWN:ReH",
      "NO_SECOND_CHANNEL",
      "RULE_NOT_EVALUABLE:ReH"
    ],
    "human_confirmation_required": [
      "certificate_type",
      "heat_or_lot",
      "grade",
      "cev_printed",
      "kv_temperature",
      "inspection_stamp",
      "chemistry.C",
      "chemistry.Si",
      "chemistry.Mn",
      "chemistry.P",
      "chemistry.S",
      "chemistry.Cr",
      "chemistry.Ni",
      "chemistry.Mo",
      "chemistry.Cu",
      "chemistry.V",
      "mechanical.ReH",
      "mechanical.Rm",
      "mechanical.A",
      "mechanical.KV_1",
      "mechanical.KV_2",
      "mechanical.KV_3"
    ],
    "note": "CertGate only proposes. A person decides. All data is fictitious. The reading is MOCK (no model)."
  },
  "receipt": {
    "receipt_schema": "certgate.receipt/1",
    "case_id": "cg-003",
    "run_id": "fc10cd9a-8dc7-4eae-9dfd-8205a3c158e3",
    "created_at": "2026-10-12T17:58:53.673Z",
    "mode": "mock",
    "reading_source": "mock",
    "reader": {
      "reader_id": "mock-reader",
      "reading_source": "mock",
      "model_id": "MOCK (no model; dataset reading)",
      "model_version": "not applicable (mock)",
      "vllm_version": "not applicable (mock)",
      "rocm_version": "not applicable (mock)",
      "calls": "1"
    },
    "planted": [],
    "status": "processed",
    "proposal": "review",
    "reasons": [
      {
        "code": "CRITICAL_UNKNOWN:ReH",
        "effect": "review",
        "detail": "mechanical.ReH could not be read with confidence"
      },
      {
        "code": "NO_SECOND_CHANNEL",
        "effect": "review",
        "detail": "no text layer: 22 critical field(s) need human confirmation"
      },
      {
        "code": "RULE_NOT_EVALUABLE:ReH",
        "effect": "review",
        "detail": "mechanical.ReH unknown"
      }
    ],
    "human_required": true,
    "human_confirmation_required": [
      "certificate_type",
      "heat_or_lot",
      "grade",
      "cev_printed",
      "kv_temperature",
      "inspection_stamp",
      "chemistry.C",
      "chemistry.Si",
      "chemistry.Mn",
      "chemistry.P",
      "chemistry.S",
      "chemistry.Cr",
      "chemistry.Ni",
      "chemistry.Mo",
      "chemistry.Cu",
      "chemistry.V",
      "mechanical.ReH",
      "mechanical.Rm",
      "mechanical.A",
      "mechanical.KV_1",
      "mechanical.KV_2",
      "mechanical.KV_3"
    ],
    "human_decision": null,
    "confirmations": [],
    "channel_available": false,
    "timings_ms": {
      "validate": "70.928",
      "text_layer": "0.176",
      "model_reading": "0.304",
      "evaluation": "1.564"
    },
    "errors": [],
    "hashes": {
      "certificate_sha256": "40899aa26ccec1e0a2e62d63a7abac8098ee0debc38df7c7b7ea121ac3619c01",
      "certificate_size": "161559",
      "delivery_note_sha256": "15a7247a6c1c2bc55894f5c2a633b5282b784b4ef0d0c6cad2b09bf40f643fe3",
      "model_output_sha256": "f677045deff58fb24a789cb75d5caa5017077b80bc2a5fe7f2dbd7bd0ca787bd",
      "spec_sha256": "2e949172707428a69e046b256ee0374203d30a3b64e139fd062db8bb8337b7c1"
    },
    "rules_version": "certgate-rules-1.0.0",
    "plausibility_version": "plausibility-v1",
    "cev_formula_source": "IIW (Dearden and O'Neill): CEV = C + Mn/6 + (Cr+Mo+V)/5 + (Cu+Ni)/15; cited in docs/sources/cev-formula.md",
    "spec": {
      "spec_id": "ESP-014",
      "revision": "3",
      "grade": "TRN-355"
    },
    "delivery": {
      "delivery_note": "ALB-2026-0917",
      "line": "3"
    },
    "values": [
      {
        "field": "issuer",
        "value": "Siderúrgica Valdemora S.A.",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "certificate_no",
        "value": "SV-2026-118512",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "certificate_type",
        "value": "3.1",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "date",
        "value": "2026-09-19",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "heat_or_lot",
        "value": "24-72015",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "grade",
        "value": "TRN-355",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "dimensions",
        "value": "Chapa 25 x 2000 x 6000 mm",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "cev_printed",
        "value": "0.40",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "kv_temperature",
        "value": "-20",
        "unit": "°C",
        "source": "known (model)"
      },
      {
        "field": "inspection_stamp",
        "value": "QA-07",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "chemistry.C",
        "value": "0.15",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.Si",
        "value": "0.19",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.Mn",
        "value": "1.38",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.P",
        "value": "0.011",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.S",
        "value": "0.005",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.Cr",
        "value": "0.05",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.Ni",
        "value": "0.04",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.Mo",
        "value": "0.01",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.Cu",
        "value": "0.07",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.V",
        "value": "0.002",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "mechanical.ReH",
        "value": null,
        "unit": null,
        "source": "unknown (model)"
      },
      {
        "field": "mechanical.Rm",
        "value": "529",
        "unit": "MPa",
        "source": "known (model)"
      },
      {
        "field": "mechanical.A",
        "value": "27",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "mechanical.KV_1",
        "value": "61",
        "unit": "J",
        "source": "known (model)"
      },
      {
        "field": "mechanical.KV_2",
        "value": "57",
        "unit": "J",
        "source": "known (model)"
      },
      {
        "field": "mechanical.KV_3",
        "value": "66",
        "unit": "J",
        "source": "known (model)"
      }
    ],
    "channel_checks": [
      {
        "field": "certificate_type",
        "model_value": "3.1",
        "model_unit": null,
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "document title"
          }
        ]
      },
      {
        "field": "heat_or_lot",
        "model_value": "24-72015",
        "model_unit": null,
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "Colada / Heat no."
          }
        ]
      },
      {
        "field": "grade",
        "model_value": "TRN-355",
        "model_unit": null,
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "Calidad / Grade"
          }
        ]
      },
      {
        "field": "cev_printed",
        "model_value": "0.40",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column CEV"
          }
        ]
      },
      {
        "field": "kv_temperature",
        "model_value": "-20",
        "model_unit": "°C",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "impact test heading"
          }
        ]
      },
      {
        "field": "inspection_stamp",
        "model_value": "QA-07",
        "model_unit": null,
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "signature block, Sello"
          }
        ]
      },
      {
        "field": "chemistry.C",
        "model_value": "0.15",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column C"
          }
        ]
      },
      {
        "field": "chemistry.Si",
        "model_value": "0.19",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Si"
          }
        ]
      },
      {
        "field": "chemistry.Mn",
        "model_value": "1.38",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Mn"
          }
        ]
      },
      {
        "field": "chemistry.P",
        "model_value": "0.011",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column P"
          }
        ]
      },
      {
        "field": "chemistry.S",
        "model_value": "0.005",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column S"
          }
        ]
      },
      {
        "field": "chemistry.Cr",
        "model_value": "0.05",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Cr"
          }
        ]
      },
      {
        "field": "chemistry.Ni",
        "model_value": "0.04",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Ni"
          }
        ]
      },
      {
        "field": "chemistry.Mo",
        "model_value": "0.01",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Mo"
          }
        ]
      },
      {
        "field": "chemistry.Cu",
        "model_value": "0.07",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Cu"
          }
        ]
      },
      {
        "field": "chemistry.V",
        "model_value": "0.002",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column V"
          }
        ]
      },
      {
        "field": "mechanical.ReH",
        "model_value": null,
        "model_unit": null,
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "mechanical tests table, column ReH"
          }
        ]
      },
      {
        "field": "mechanical.Rm",
        "model_value": "529",
        "model_unit": "MPa",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "mechanical tests table, column Rm"
          }
        ]
      },
      {
        "field": "mechanical.A",
        "model_value": "27",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "mechanical tests table, column A"
          }
        ]
      },
      {
        "field": "mechanical.KV_1",
        "model_value": "61",
        "model_unit": "J",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "impact test table, Probeta 1"
          }
        ]
      },
      {
        "field": "mechanical.KV_2",
        "model_value": "57",
        "model_unit": "J",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "impact test table, Probeta 2"
          }
        ]
      },
      {
        "field": "mechanical.KV_3",
        "model_value": "66",
        "model_unit": "J",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "impact test table, Probeta 3"
          }
        ]
      }
    ],
    "rule_results": [
      {
        "rule_id": "ESP-014.r3.C",
        "input_field_refs": [
          "chemistry.C"
        ],
        "outcome": "pass",
        "expected": "<= 0.20 %",
        "observed": "0.15",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.Si",
        "input_field_refs": [
          "chemistry.Si"
        ],
        "outcome": "pass",
        "expected": "<= 0.55 %",
        "observed": "0.19",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.Mn",
        "input_field_refs": [
          "chemistry.Mn"
        ],
        "outcome": "pass",
        "expected": "<= 1.60 %",
        "observed": "1.38",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.P",
        "input_field_refs": [
          "chemistry.P"
        ],
        "outcome": "pass",
        "expected": "<= 0.025 %",
        "observed": "0.011",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.S",
        "input_field_refs": [
          "chemistry.S"
        ],
        "outcome": "pass",
        "expected": "<= 0.025 %",
        "observed": "0.005",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.Cu",
        "input_field_refs": [
          "chemistry.Cu"
        ],
        "outcome": "pass",
        "expected": "<= 0.55 %",
        "observed": "0.07",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.ReH",
        "input_field_refs": [
          "mechanical.ReH"
        ],
        "outcome": "not_evaluable",
        "expected": ">= 355 MPa",
        "observed": null,
        "reason": "mechanical.ReH unknown"
      },
      {
        "rule_id": "ESP-014.r3.Rm",
        "input_field_refs": [
          "mechanical.Rm"
        ],
        "outcome": "pass",
        "expected": ">= 470 and <= 630 MPa",
        "observed": "529",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.A",
        "input_field_refs": [
          "mechanical.A"
        ],
        "outcome": "pass",
        "expected": ">= 20 %",
        "observed": "27",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.CEV.printed",
        "input_field_refs": [
          "cev_printed"
        ],
        "outcome": "pass",
        "expected": "<= 0.45 %",
        "observed": "0.40",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.CEV.recomputed",
        "input_field_refs": [
          "chemistry.C",
          "chemistry.Mn",
          "chemistry.Cr",
          "chemistry.Mo",
          "chemistry.V",
          "chemistry.Ni",
          "chemistry.Cu"
        ],
        "outcome": "pass",
        "expected": "<= 0.45 %",
        "observed": "0.39973333333333333333333333333333333333333333333333",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.KV_media",
        "input_field_refs": [
          "mechanical.KV_1",
          "mechanical.KV_2",
          "mechanical.KV_3"
        ],
        "outcome": "pass",
        "expected": "mean of 3 >= 27 J (sum >= 81)",
        "observed": "sum 184",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.grade",
        "input_field_refs": [
          "grade",
          "delivery_line.grade_ordered"
        ],
        "outcome": "pass",
        "expected": "TRN-355 (spec) and TRN-355 (ordered)",
        "observed": "TRN-355",
        "reason": "grade matches"
      }
    ],
    "notice": "All data is fictitious: Siderúrgica Valdemora S.A., Talleres Ribera Norte S.L., grade TRN-355 and spec ESP-014 are invented for this demo."
  }
}

[exit 0]
$ docker run --rm --network none certgate node dist/src/cli.js process --case cg-003
{
  "summary": {
    "case_id": "cg-003",
    "status": "processed",
    "proposal": "review",
    "human_required": true,
    "reading_source": "mock",
    "reasons": [
      "CRITICAL_UNKNOWN:ReH",
      "NO_SECOND_CHANNEL",
      "RULE_NOT_EVALUABLE:ReH"
    ],
    "human_confirmation_required": [
      "certificate_type",
      "heat_or_lot",
      "grade",
      "cev_printed",
      "kv_temperature",
      "inspection_stamp",
      "chemistry.C",
      "chemistry.Si",
      "chemistry.Mn",
      "chemistry.P",
      "chemistry.S",
      "chemistry.Cr",
      "chemistry.Ni",
      "chemistry.Mo",
      "chemistry.Cu",
      "chemistry.V",
      "mechanical.ReH",
      "mechanical.Rm",
      "mechanical.A",
      "mechanical.KV_1",
      "mechanical.KV_2",
      "mechanical.KV_3"
    ],
    "note": "CertGate only proposes. A person decides. All data is fictitious. The reading is MOCK (no model)."
  },
  "receipt": {
    "receipt_schema": "certgate.receipt/1",
    "case_id": "cg-003",
    "run_id": "51fa4c4e-6e96-4cf7-a68d-a1bb20081865",
    "created_at": "2026-10-12T17:58:54.260Z",
    "mode": "mock",
    "reading_source": "mock",
    "reader": {
      "reader_id": "mock-reader",
      "reading_source": "mock",
      "model_id": "MOCK (no model; dataset reading)",
      "model_version": "not applicable (mock)",
      "vllm_version": "not applicable (mock)",
      "rocm_version": "not applicable (mock)",
      "calls": "1"
    },
    "planted": [],
    "status": "processed",
    "proposal": "review",
    "reasons": [
      {
        "code": "CRITICAL_UNKNOWN:ReH",
        "effect": "review",
        "detail": "mechanical.ReH could not be read with confidence"
      },
      {
        "code": "NO_SECOND_CHANNEL",
        "effect": "review",
        "detail": "no text layer: 22 critical field(s) need human confirmation"
      },
      {
        "code": "RULE_NOT_EVALUABLE:ReH",
        "effect": "review",
        "detail": "mechanical.ReH unknown"
      }
    ],
    "human_required": true,
    "human_confirmation_required": [
      "certificate_type",
      "heat_or_lot",
      "grade",
      "cev_printed",
      "kv_temperature",
      "inspection_stamp",
      "chemistry.C",
      "chemistry.Si",
      "chemistry.Mn",
      "chemistry.P",
      "chemistry.S",
      "chemistry.Cr",
      "chemistry.Ni",
      "chemistry.Mo",
      "chemistry.Cu",
      "chemistry.V",
      "mechanical.ReH",
      "mechanical.Rm",
      "mechanical.A",
      "mechanical.KV_1",
      "mechanical.KV_2",
      "mechanical.KV_3"
    ],
    "human_decision": null,
    "confirmations": [],
    "channel_available": false,
    "timings_ms": {
      "validate": "83.007",
      "text_layer": "0.184",
      "model_reading": "0.282",
      "evaluation": "1.581"
    },
    "errors": [],
    "hashes": {
      "certificate_sha256": "40899aa26ccec1e0a2e62d63a7abac8098ee0debc38df7c7b7ea121ac3619c01",
      "certificate_size": "161559",
      "delivery_note_sha256": "15a7247a6c1c2bc55894f5c2a633b5282b784b4ef0d0c6cad2b09bf40f643fe3",
      "model_output_sha256": "f677045deff58fb24a789cb75d5caa5017077b80bc2a5fe7f2dbd7bd0ca787bd",
      "spec_sha256": "2e949172707428a69e046b256ee0374203d30a3b64e139fd062db8bb8337b7c1"
    },
    "rules_version": "certgate-rules-1.0.0",
    "plausibility_version": "plausibility-v1",
    "cev_formula_source": "IIW (Dearden and O'Neill): CEV = C + Mn/6 + (Cr+Mo+V)/5 + (Cu+Ni)/15; cited in docs/sources/cev-formula.md",
    "spec": {
      "spec_id": "ESP-014",
      "revision": "3",
      "grade": "TRN-355"
    },
    "delivery": {
      "delivery_note": "ALB-2026-0917",
      "line": "3"
    },
    "values": [
      {
        "field": "issuer",
        "value": "Siderúrgica Valdemora S.A.",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "certificate_no",
        "value": "SV-2026-118512",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "certificate_type",
        "value": "3.1",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "date",
        "value": "2026-09-19",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "heat_or_lot",
        "value": "24-72015",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "grade",
        "value": "TRN-355",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "dimensions",
        "value": "Chapa 25 x 2000 x 6000 mm",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "cev_printed",
        "value": "0.40",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "kv_temperature",
        "value": "-20",
        "unit": "°C",
        "source": "known (model)"
      },
      {
        "field": "inspection_stamp",
        "value": "QA-07",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "chemistry.C",
        "value": "0.15",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.Si",
        "value": "0.19",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.Mn",
        "value": "1.38",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.P",
        "value": "0.011",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.S",
        "value": "0.005",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.Cr",
        "value": "0.05",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.Ni",
        "value": "0.04",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.Mo",
        "value": "0.01",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.Cu",
        "value": "0.07",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "chemistry.V",
        "value": "0.002",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "mechanical.ReH",
        "value": null,
        "unit": null,
        "source": "unknown (model)"
      },
      {
        "field": "mechanical.Rm",
        "value": "529",
        "unit": "MPa",
        "source": "known (model)"
      },
      {
        "field": "mechanical.A",
        "value": "27",
        "unit": "%",
        "source": "known (model)"
      },
      {
        "field": "mechanical.KV_1",
        "value": "61",
        "unit": "J",
        "source": "known (model)"
      },
      {
        "field": "mechanical.KV_2",
        "value": "57",
        "unit": "J",
        "source": "known (model)"
      },
      {
        "field": "mechanical.KV_3",
        "value": "66",
        "unit": "J",
        "source": "known (model)"
      }
    ],
    "channel_checks": [
      {
        "field": "certificate_type",
        "model_value": "3.1",
        "model_unit": null,
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "document title"
          }
        ]
      },
      {
        "field": "heat_or_lot",
        "model_value": "24-72015",
        "model_unit": null,
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "Colada / Heat no."
          }
        ]
      },
      {
        "field": "grade",
        "model_value": "TRN-355",
        "model_unit": null,
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "Calidad / Grade"
          }
        ]
      },
      {
        "field": "cev_printed",
        "model_value": "0.40",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column CEV"
          }
        ]
      },
      {
        "field": "kv_temperature",
        "model_value": "-20",
        "model_unit": "°C",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "impact test heading"
          }
        ]
      },
      {
        "field": "inspection_stamp",
        "model_value": "QA-07",
        "model_unit": null,
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "signature block, Sello"
          }
        ]
      },
      {
        "field": "chemistry.C",
        "model_value": "0.15",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column C"
          }
        ]
      },
      {
        "field": "chemistry.Si",
        "model_value": "0.19",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Si"
          }
        ]
      },
      {
        "field": "chemistry.Mn",
        "model_value": "1.38",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Mn"
          }
        ]
      },
      {
        "field": "chemistry.P",
        "model_value": "0.011",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column P"
          }
        ]
      },
      {
        "field": "chemistry.S",
        "model_value": "0.005",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column S"
          }
        ]
      },
      {
        "field": "chemistry.Cr",
        "model_value": "0.05",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Cr"
          }
        ]
      },
      {
        "field": "chemistry.Ni",
        "model_value": "0.04",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Ni"
          }
        ]
      },
      {
        "field": "chemistry.Mo",
        "model_value": "0.01",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Mo"
          }
        ]
      },
      {
        "field": "chemistry.Cu",
        "model_value": "0.07",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Cu"
          }
        ]
      },
      {
        "field": "chemistry.V",
        "model_value": "0.002",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column V"
          }
        ]
      },
      {
        "field": "mechanical.ReH",
        "model_value": null,
        "model_unit": null,
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "mechanical tests table, column ReH"
          }
        ]
      },
      {
        "field": "mechanical.Rm",
        "model_value": "529",
        "model_unit": "MPa",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "mechanical tests table, column Rm"
          }
        ]
      },
      {
        "field": "mechanical.A",
        "model_value": "27",
        "model_unit": "%",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "mechanical tests table, column A"
          }
        ]
      },
      {
        "field": "mechanical.KV_1",
        "model_value": "61",
        "model_unit": "J",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "impact test table, Probeta 1"
          }
        ]
      },
      {
        "field": "mechanical.KV_2",
        "model_value": "57",
        "model_unit": "J",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "impact test table, Probeta 2"
          }
        ]
      },
      {
        "field": "mechanical.KV_3",
        "model_value": "66",
        "model_unit": "J",
        "text_layer_value": null,
        "text_layer_unit": null,
        "agree": false,
        "channel_available": false,
        "issue": "no_second_channel",
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "impact test table, Probeta 3"
          }
        ]
      }
    ],
    "rule_results": [
      {
        "rule_id": "ESP-014.r3.C",
        "input_field_refs": [
          "chemistry.C"
        ],
        "outcome": "pass",
        "expected": "<= 0.20 %",
        "observed": "0.15",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.Si",
        "input_field_refs": [
          "chemistry.Si"
        ],
        "outcome": "pass",
        "expected": "<= 0.55 %",
        "observed": "0.19",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.Mn",
        "input_field_refs": [
          "chemistry.Mn"
        ],
        "outcome": "pass",
        "expected": "<= 1.60 %",
        "observed": "1.38",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.P",
        "input_field_refs": [
          "chemistry.P"
        ],
        "outcome": "pass",
        "expected": "<= 0.025 %",
        "observed": "0.011",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.S",
        "input_field_refs": [
          "chemistry.S"
        ],
        "outcome": "pass",
        "expected": "<= 0.025 %",
        "observed": "0.005",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.Cu",
        "input_field_refs": [
          "chemistry.Cu"
        ],
        "outcome": "pass",
        "expected": "<= 0.55 %",
        "observed": "0.07",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.ReH",
        "input_field_refs": [
          "mechanical.ReH"
        ],
        "outcome": "not_evaluable",
        "expected": ">= 355 MPa",
        "observed": null,
        "reason": "mechanical.ReH unknown"
      },
      {
        "rule_id": "ESP-014.r3.Rm",
        "input_field_refs": [
          "mechanical.Rm"
        ],
        "outcome": "pass",
        "expected": ">= 470 and <= 630 MPa",
        "observed": "529",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.A",
        "input_field_refs": [
          "mechanical.A"
        ],
        "outcome": "pass",
        "expected": ">= 20 %",
        "observed": "27",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.CEV.printed",
        "input_field_refs": [
          "cev_printed"
        ],
        "outcome": "pass",
        "expected": "<= 0.45 %",
        "observed": "0.40",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.CEV.recomputed",
        "input_field_refs": [
          "chemistry.C",
          "chemistry.Mn",
          "chemistry.Cr",
          "chemistry.Mo",
          "chemistry.V",
          "chemistry.Ni",
          "chemistry.Cu"
        ],
        "outcome": "pass",
        "expected": "<= 0.45 %",
        "observed": "0.39973333333333333333333333333333333333333333333333",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.KV_media",
        "input_field_refs": [
          "mechanical.KV_1",
          "mechanical.KV_2",
          "mechanical.KV_3"
        ],
        "outcome": "pass",
        "expected": "mean of 3 >= 27 J (sum >= 81)",
        "observed": "sum 184",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.grade",
        "input_field_refs": [
          "grade",
          "delivery_line.grade_ordered"
        ],
        "outcome": "pass",
        "expected": "TRN-355 (spec) and TRN-355 (ordered)",
        "observed": "TRN-355",
        "reason": "grade matches"
      }
    ],
    "notice": "All data is fictitious: Siderúrgica Valdemora S.A., Talleres Ribera Norte S.L., grade TRN-355 and spec ESP-014 are invented for this demo."
  }
}
[exit 0]
$ docker run --rm --network none certgate npx vitest run

[1m[30m[46m RUN [49m[39m[22m [36mv5.0.4 [39m[90m/app[39m

 [32m✓[39m test/rules.test.ts [2m([22m[2m35 tests[22m[2m)[22m[32m 91[2mms[22m[39m
 [32m✓[39m test/inputs.test.ts [2m([22m[2m15 tests[22m[2m)[22m[33m 313[2mms[22m[39m
 [32m✓[39m test/reader.test.ts [2m([22m[2m21 tests[22m[2m)[22m[33m 381[2mms[22m[39m
 [32m✓[39m test/entrypoints.test.ts [2m([22m[2m10 tests[22m[2m)[22m[33m 347[2mms[22m[39m
 [32m✓[39m test/channels.test.ts [2m([22m[2m23 tests[22m[2m)[22m[33m 465[2mms[22m[39m
 [32m✓[39m test/static.test.ts [2m([22m[2m36 tests[22m[2m)[22m[32m 34[2mms[22m[39m
 [32m✓[39m test/human.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 263[2mms[22m[39m
 [32m✓[39m test/dataset.test.ts [2m([22m[2m36 tests[22m[2m)[22m[33m 554[2mms[22m[39m
 [32m✓[39m test/isolation.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 319[2mms[22m[39m

[2m Test Files [22m [1m[32m9 passed[39m[22m[90m (9)[39m
[2m      Tests [22m [1m[32m188 passed[39m[22m[90m (188)[39m
[2m   Start at [22m 17:58:55
[2m   Duration [22m 1.14s[2m (tests 73%, transform 17%, import 9%, worker 1%)[22m

[exit 0]
$ npm ci

added 42 packages, and audited 43 packages in 6s

14 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
[exit 0]
$ npm run build

> certgate@0.1.0 build
> tsc -p tsconfig.json

[exit 0]
$ npm test

> certgate@0.1.0 test
> vitest run


 RUN  v5.0.4 C:/Users/hugo_/AppData/Local/Temp/claude/C--nexus-dev-certgate/574a9734-076b-4541-8550-dd6b1241a749/scratchpad/clone-9d04499


 Test Files  9 passed (9)
      Tests  188 passed (188)
   Start at  19:59:05
   Duration  2.51s (tests 85%, transform 9%, import 5%)

[exit 0]
$ node dist/src/cli.js list
cg-001
cg-002
cg-003
cg-004
cg-005
cg-006
cg-007
cg-008
cg-009
cg-010
cg-011
cg-012
cg-013
cg-014
cg-015
cg-016
cg-017
cg-018
cg-019
cg-020
cg-021
cg-022
cg-023
cg-024
cg-025
cg-026
cg-027
cg-028
cg-029
cg-030
[exit 0]
$ node dist/src/cli.js process --case cg-001
{
  "summary": {
    "case_id": "cg-001",
    "status": "processed",
    "proposal": "release",
    "human_required": true,
    "reading_source": "mock",
    "reasons": [],
    "human_confirmation_required": [],
    "note": "CertGate only proposes. A person decides. All data is fictitious. The reading is MOCK (no model)."
  },
  "receipt": {
    "receipt_schema": "certgate.receipt/1",
    "case_id": "cg-001",
    "run_id": "5c47371d-5e49-45e3-9f0d-8d2de9e4c850",
    "created_at": "2026-10-12T17:59:08.933Z",
    "mode": "mock",
    "reading_source": "mock",
    "reader": {
      "reader_id": "mock-reader",
      "reading_source": "mock",
      "model_id": "MOCK (no model; dataset reading)",
      "model_version": "not applicable (mock)",
      "vllm_version": "not applicable (mock)",
      "rocm_version": "not applicable (mock)",
      "calls": "1"
    },
    "planted": [],
    "status": "processed",
    "proposal": "release",
    "reasons": [],
    "human_required": true,
    "human_confirmation_required": [],
    "human_decision": null,
    "confirmations": [],
    "channel_available": true,
    "timings_ms": {
      "validate": "407.639",
      "text_layer": "4.210",
      "model_reading": "0.571",
      "evaluation": "2.136"
    },
    "errors": [],
    "hashes": {
      "certificate_sha256": "55c15e2e23d2928af427c633c19ef1605f9e4145ba330c0aec1b469d19eca4c6",
      "certificate_size": "3350",
      "delivery_note_sha256": "15a7247a6c1c2bc55894f5c2a633b5282b784b4ef0d0c6cad2b09bf40f643fe3",
      "model_output_sha256": "9616a2ffe4bb6977dc24a87647ba4c670bbb23451158325cf61a61eaa0b6a47b",
      "spec_sha256": "2e949172707428a69e046b256ee0374203d30a3b64e139fd062db8bb8337b7c1"
    },
    "rules_version": "certgate-rules-1.0.0",
    "plausibility_version": "plausibility-v1",
    "cev_formula_source": "IIW (Dearden and O'Neill): CEV = C + Mn/6 + (Cr+Mo+V)/5 + (Cu+Ni)/15; cited in docs/sources/cev-formula.md",
    "spec": {
      "spec_id": "ESP-014",
      "revision": "3",
      "grade": "TRN-355"
    },
    "delivery": {
      "delivery_note": "ALB-2026-0917",
      "line": "1"
    },
    "values": [
      {
        "field": "issuer",
        "value": "Siderúrgica Valdemora S.A.",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "certificate_no",
        "value": "SV-2026-118204",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "certificate_type",
        "value": "3.1",
        "unit": null,
        "source": "known (model+text_layer)"
      },
      {
        "field": "date",
        "value": "2026-09-14",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "heat_or_lot",
        "value": "24-71830",
        "unit": null,
        "source": "known (model+text_layer)"
      },
      {
        "field": "grade",
        "value": "TRN-355",
        "unit": null,
        "source": "known (model+text_layer)"
      },
      {
        "field": "dimensions",
        "value": "Chapa 20 x 2000 x 6000 mm",
        "unit": null,
        "source": "known (model)"
      },
      {
        "field": "cev_printed",
        "value": "0.41",
        "unit": "%",
        "source": "known (model+text_layer)"
      },
      {
        "field": "kv_temperature",
        "value": "-20",
        "unit": "°C",
        "source": "known (model+text_layer)"
      },
      {
        "field": "inspection_stamp",
        "value": "QA-07",
        "unit": null,
        "source": "known (model+text_layer)"
      },
      {
        "field": "chemistry.C",
        "value": "0.16",
        "unit": "%",
        "source": "known (model+text_layer)"
      },
      {
        "field": "chemistry.Si",
        "value": "0.21",
        "unit": "%",
        "source": "known (model+text_layer)"
      },
      {
        "field": "chemistry.Mn",
        "value": "1.42",
        "unit": "%",
        "source": "known (model+text_layer)"
      },
      {
        "field": "chemistry.P",
        "value": "0.012",
        "unit": "%",
        "source": "known (model+text_layer)"
      },
      {
        "field": "chemistry.S",
        "value": "0.006",
        "unit": "%",
        "source": "known (model+text_layer)"
      },
      {
        "field": "chemistry.Cr",
        "value": "0.04",
        "unit": "%",
        "source": "known (model+text_layer)"
      },
      {
        "field": "chemistry.Ni",
        "value": "0.03",
        "unit": "%",
        "source": "known (model+text_layer)"
      },
      {
        "field": "chemistry.Mo",
        "value": "0.01",
        "unit": "%",
        "source": "known (model+text_layer)"
      },
      {
        "field": "chemistry.Cu",
        "value": "0.05",
        "unit": "%",
        "source": "known (model+text_layer)"
      },
      {
        "field": "chemistry.V",
        "value": "0.002",
        "unit": "%",
        "source": "known (model+text_layer)"
      },
      {
        "field": "mechanical.ReH",
        "value": "392",
        "unit": "MPa",
        "source": "known (model+text_layer)"
      },
      {
        "field": "mechanical.Rm",
        "value": "538",
        "unit": "MPa",
        "source": "known (model+text_layer)"
      },
      {
        "field": "mechanical.A",
        "value": "26",
        "unit": "%",
        "source": "known (model+text_layer)"
      },
      {
        "field": "mechanical.KV_1",
        "value": "64",
        "unit": "J",
        "source": "known (model+text_layer)"
      },
      {
        "field": "mechanical.KV_2",
        "value": "71",
        "unit": "J",
        "source": "known (model+text_layer)"
      },
      {
        "field": "mechanical.KV_3",
        "value": "58",
        "unit": "J",
        "source": "known (model+text_layer)"
      }
    ],
    "channel_checks": [
      {
        "field": "certificate_type",
        "model_value": "3.1",
        "model_unit": null,
        "text_layer_value": "3.1",
        "text_layer_unit": null,
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "document title"
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "document title",
            "x": "330.0",
            "y": "791.9"
          }
        ]
      },
      {
        "field": "heat_or_lot",
        "model_value": "24-71830",
        "model_unit": null,
        "text_layer_value": "24-71830",
        "text_layer_unit": null,
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "Colada / Heat no."
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "Colada / Heat no.",
            "x": "40.0",
            "y": "653.9"
          }
        ]
      },
      {
        "field": "grade",
        "model_value": "TRN-355",
        "model_unit": null,
        "text_layer_value": "TRN-355",
        "text_layer_unit": null,
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "Calidad / Grade"
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "Calidad / Grade",
            "x": "40.0",
            "y": "668.9"
          }
        ]
      },
      {
        "field": "cev_printed",
        "model_value": "0.41",
        "model_unit": "%",
        "text_layer_value": "0.41",
        "text_layer_unit": "%",
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column CEV"
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "heat analysis header CEV",
            "x": "514.2",
            "y": "576.9"
          }
        ]
      },
      {
        "field": "kv_temperature",
        "model_value": "-20",
        "model_unit": "°C",
        "text_layer_value": "-20",
        "text_layer_unit": "°C",
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "impact test heading"
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "impact test heading",
            "y": "438.9"
          }
        ]
      },
      {
        "field": "inspection_stamp",
        "model_value": "QA-07",
        "model_unit": null,
        "text_layer_value": "QA-07",
        "text_layer_unit": null,
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "signature block, Sello"
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "signature block",
            "y": "296.9"
          }
        ]
      },
      {
        "field": "chemistry.C",
        "model_value": "0.16",
        "model_unit": "%",
        "text_layer_value": "0.16",
        "text_layer_unit": "%",
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column C"
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "heat analysis header C",
            "x": "46.0",
            "y": "576.9"
          }
        ]
      },
      {
        "field": "chemistry.Si",
        "model_value": "0.21",
        "model_unit": "%",
        "text_layer_value": "0.21",
        "text_layer_unit": "%",
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Si"
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "heat analysis header Si",
            "x": "92.8",
            "y": "576.9"
          }
        ]
      },
      {
        "field": "chemistry.Mn",
        "model_value": "1.42",
        "model_unit": "%",
        "text_layer_value": "1.42",
        "text_layer_unit": "%",
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Mn"
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "heat analysis header Mn",
            "x": "139.6",
            "y": "576.9"
          }
        ]
      },
      {
        "field": "chemistry.P",
        "model_value": "0.012",
        "model_unit": "%",
        "text_layer_value": "0.012",
        "text_layer_unit": "%",
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column P"
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "heat analysis header P",
            "x": "186.5",
            "y": "576.9"
          }
        ]
      },
      {
        "field": "chemistry.S",
        "model_value": "0.006",
        "model_unit": "%",
        "text_layer_value": "0.006",
        "text_layer_unit": "%",
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column S"
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "heat analysis header S",
            "x": "233.3",
            "y": "576.9"
          }
        ]
      },
      {
        "field": "chemistry.Cr",
        "model_value": "0.04",
        "model_unit": "%",
        "text_layer_value": "0.04",
        "text_layer_unit": "%",
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Cr"
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "heat analysis header Cr",
            "x": "280.1",
            "y": "576.9"
          }
        ]
      },
      {
        "field": "chemistry.Ni",
        "model_value": "0.03",
        "model_unit": "%",
        "text_layer_value": "0.03",
        "text_layer_unit": "%",
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Ni"
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "heat analysis header Ni",
            "x": "326.9",
            "y": "576.9"
          }
        ]
      },
      {
        "field": "chemistry.Mo",
        "model_value": "0.01",
        "model_unit": "%",
        "text_layer_value": "0.01",
        "text_layer_unit": "%",
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Mo"
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "heat analysis header Mo",
            "x": "373.7",
            "y": "576.9"
          }
        ]
      },
      {
        "field": "chemistry.Cu",
        "model_value": "0.05",
        "model_unit": "%",
        "text_layer_value": "0.05",
        "text_layer_unit": "%",
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column Cu"
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "heat analysis header Cu",
            "x": "420.5",
            "y": "576.9"
          }
        ]
      },
      {
        "field": "chemistry.V",
        "model_value": "0.002",
        "model_unit": "%",
        "text_layer_value": "0.002",
        "text_layer_unit": "%",
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "heat analysis table, column V"
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "heat analysis header V",
            "x": "467.4",
            "y": "576.9"
          }
        ]
      },
      {
        "field": "mechanical.ReH",
        "model_value": "392",
        "model_unit": "MPa",
        "text_layer_value": "392",
        "text_layer_unit": "MPa",
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "mechanical tests table, column ReH"
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "mechanical header ReH (MPa)",
            "x": "46.0",
            "y": "488.9"
          }
        ]
      },
      {
        "field": "mechanical.Rm",
        "model_value": "538",
        "model_unit": "MPa",
        "text_layer_value": "538",
        "text_layer_unit": "MPa",
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "mechanical tests table, column Rm"
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "mechanical header Rm (MPa)",
            "x": "176.0",
            "y": "488.9"
          }
        ]
      },
      {
        "field": "mechanical.A",
        "model_value": "26",
        "model_unit": "%",
        "text_layer_value": "26",
        "text_layer_unit": "%",
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "mechanical tests table, column A"
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "mechanical header A (%)",
            "x": "306.0",
            "y": "488.9"
          }
        ]
      },
      {
        "field": "mechanical.KV_1",
        "model_value": "64",
        "model_unit": "J",
        "text_layer_value": "64",
        "text_layer_unit": "J",
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "impact test table, Probeta 1"
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "impact header Probeta 1",
            "x": "46.0",
            "y": "414.9"
          }
        ]
      },
      {
        "field": "mechanical.KV_2",
        "model_value": "71",
        "model_unit": "J",
        "text_layer_value": "71",
        "text_layer_unit": "J",
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "impact test table, Probeta 2"
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "impact header Probeta 2",
            "x": "176.0",
            "y": "414.9"
          }
        ]
      },
      {
        "field": "mechanical.KV_3",
        "model_value": "58",
        "model_unit": "J",
        "text_layer_value": "58",
        "text_layer_unit": "J",
        "agree": true,
        "channel_available": true,
        "issue": null,
        "human_confirmed": false,
        "source_refs": [
          {
            "channel": "model",
            "page": "1",
            "fragment": "impact test table, Probeta 3"
          },
          {
            "channel": "text_layer",
            "page": "1",
            "fragment": "impact header Probeta 3",
            "x": "306.0",
            "y": "414.9"
          }
        ]
      }
    ],
    "rule_results": [
      {
        "rule_id": "ESP-014.r3.C",
        "input_field_refs": [
          "chemistry.C"
        ],
        "outcome": "pass",
        "expected": "<= 0.20 %",
        "observed": "0.16",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.Si",
        "input_field_refs": [
          "chemistry.Si"
        ],
        "outcome": "pass",
        "expected": "<= 0.55 %",
        "observed": "0.21",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.Mn",
        "input_field_refs": [
          "chemistry.Mn"
        ],
        "outcome": "pass",
        "expected": "<= 1.60 %",
        "observed": "1.42",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.P",
        "input_field_refs": [
          "chemistry.P"
        ],
        "outcome": "pass",
        "expected": "<= 0.025 %",
        "observed": "0.012",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.S",
        "input_field_refs": [
          "chemistry.S"
        ],
        "outcome": "pass",
        "expected": "<= 0.025 %",
        "observed": "0.006",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.Cu",
        "input_field_refs": [
          "chemistry.Cu"
        ],
        "outcome": "pass",
        "expected": "<= 0.55 %",
        "observed": "0.05",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.ReH",
        "input_field_refs": [
          "mechanical.ReH"
        ],
        "outcome": "pass",
        "expected": ">= 355 MPa",
        "observed": "392",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.Rm",
        "input_field_refs": [
          "mechanical.Rm"
        ],
        "outcome": "pass",
        "expected": ">= 470 and <= 630 MPa",
        "observed": "538",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.A",
        "input_field_refs": [
          "mechanical.A"
        ],
        "outcome": "pass",
        "expected": ">= 20 %",
        "observed": "26",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.CEV.printed",
        "input_field_refs": [
          "cev_printed"
        ],
        "outcome": "pass",
        "expected": "<= 0.45 %",
        "observed": "0.41",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.CEV.recomputed",
        "input_field_refs": [
          "chemistry.C",
          "chemistry.Mn",
          "chemistry.Cr",
          "chemistry.Mo",
          "chemistry.V",
          "chemistry.Ni",
          "chemistry.Cu"
        ],
        "outcome": "pass",
        "expected": "<= 0.45 %",
        "observed": "0.4124",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.KV_media",
        "input_field_refs": [
          "mechanical.KV_1",
          "mechanical.KV_2",
          "mechanical.KV_3"
        ],
        "outcome": "pass",
        "expected": "mean of 3 >= 27 J (sum >= 81)",
        "observed": "sum 193",
        "reason": "within limit"
      },
      {
        "rule_id": "ESP-014.r3.grade",
        "input_field_refs": [
          "grade",
          "delivery_line.grade_ordered"
        ],
        "outcome": "pass",
        "expected": "TRN-355 (spec) and TRN-355 (ordered)",
        "observed": "TRN-355",
        "reason": "grade matches"
      }
    ],
    "notice": "All data is fictitious: Siderúrgica Valdemora S.A., Talleres Ribera Norte S.L., grade TRN-355 and spec ESP-014 are invented for this demo."
  }
}
[exit 0]
