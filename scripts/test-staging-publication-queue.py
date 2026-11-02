"""Render Helm dependencies before running: python3 scripts/test-staging-publication-queue.py.

Requires Helm on PATH and PyYAML. No cluster or Azure writes are performed.
"""

import os
from pathlib import Path
import subprocess
import tempfile
import unittest

import yaml


ROOT = Path(__file__).resolve().parents[1]
CHART = ROOT / "charts/opal-rm-frontend"


def render(staging=False, build="408"):
    args = [os.environ.get("HELM", "helm"), "template", "opal-rm-frontend-staging", str(CHART),
            "--namespace", "opal", "--set", "global.environment=stg"]
    with tempfile.TemporaryDirectory() as directory:
        if staging:
            text = (CHART / "values.stg.template.yaml").read_text()
            replacements = {"SERVICE_NAME": "opal-rm-frontend-staging", "BUILD_NUMBER": build,
                            "IMAGE_NAME": "example.invalid/rm:test", "SERVICE_FQDN": "test.invalid"}
            for key, value in replacements.items():
                text = text.replace("${" + key + "}", value)
            values = Path(directory) / "values.yaml"
            values.write_text(text)
            args += ["-f", str(values)]
        output = subprocess.check_output(args, text=True)
    return [item for item in yaml.safe_load_all(output) if item]


class StagingPublicationQueueTest(unittest.TestCase):
    def test_staging_backend_and_queue_are_isolated_together(self):
        documents = render(staging=True)
        queues = [d for d in documents if d["kind"] == "NamespacesQueue"]
        self.assertEqual(len(queues), 1, "staging must provision its own publication queue")
        queue = queues[0]
        self.assertEqual(queue["spec"]["azureName"], "opal-rm-frontend-staging-rm-publish-408")
        self.assertIn("/resourceGroups/opal-stg/providers/Microsoft.ServiceBus/namespaces/opal-servicebus-stg",
                      queue["spec"]["owner"]["armId"])
        self.assertNotIn("name", queue["spec"]["owner"])
        self.assertFalse(any(d["kind"] == "Namespace" and d.get("apiVersion", "").startswith("servicebus.")
                             for d in documents), "the shared namespace must not be Helm-owned")
        backends = [d for d in documents if d["kind"] == "Deployment"
                    and "maintenance-service" in d["metadata"]["name"]]
        self.assertEqual(len(backends), 1)
        env = {e["name"]: e.get("value") for c in backends[0]["spec"]["template"]["spec"]["containers"]
               for e in c.get("env", [])}
        self.assertEqual(env["SERVICEBUS_RM_PUBLISH_DRAFT_CASEFILE_QUEUE_NAME"], queue["spec"]["azureName"])
        self.assertEqual(env["OPAL_MAINTENANCE_DB_HOST"], "opal-rm-frontend-staging-postgresql")

    def test_durable_release_does_not_provision_a_queue(self):
        self.assertFalse(any(d["kind"] == "NamespacesQueue" for d in render()))

    def test_subsequent_run_uses_a_different_queue(self):
        queues = [d for d in render(staging=True, build="409") if d["kind"] == "NamespacesQueue"]
        self.assertEqual(len(queues), 1)
        self.assertEqual(queues[0]["spec"]["azureName"], "opal-rm-frontend-staging-rm-publish-409")


if __name__ == "__main__":
    unittest.main()
