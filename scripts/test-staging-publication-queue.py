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


def render(staging=False, build="408", raw_template=False):
    args = [os.environ.get("HELM", "helm"), "template", "opal-rm-frontend-staging", str(CHART),
            "--namespace", "opal", "--set", "global.environment=stg"]
    with tempfile.TemporaryDirectory() as directory:
        if staging:
            text = (CHART / "values.stg.template.yaml").read_text()
            replacements = {"SERVICE_NAME": "opal-rm-frontend-staging", "BUILD_NUMBER": build,
                            "IMAGE_NAME": "example.invalid/rm:test", "SERVICE_FQDN": "test.invalid"}
            if not raw_template:
                for key, value in replacements.items():
                    text = text.replace("${" + key + "}", value)
            values = Path(directory) / "values.yaml"
            values.write_text(text)
            args += ["-f", str(values)]
        output = subprocess.check_output(args, text=True, stderr=subprocess.PIPE)
    return [item for item in yaml.safe_load_all(output) if item]


class StagingPublicationQueueTest(unittest.TestCase):
    def test_raw_staging_template_remains_renderable_for_schema_validation(self):
        documents = render(staging=True, raw_template=True)
        queues = [d for d in documents if d["kind"] == "NamespacesQueue"]
        self.assertEqual(len(queues), 1)
        queue_name = "opal-rm-frontend-staging-rm-publish-${BUILD_NUMBER}"
        self.assertEqual(queues[0]["metadata"]["name"], queue_name)
        self.assertEqual(queues[0]["spec"]["azureName"], queue_name)
        backends = [d for d in documents if d["kind"] == "Deployment"
                    and "maintenance-service" in d["metadata"]["name"]]
        self.assertEqual(len(backends), 1, "schema validation must receive the backend manifest")
        env = {e["name"]: e.get("value") for c in backends[0]["spec"]["template"]["spec"]["containers"]
               for e in c.get("env", [])}
        self.assertEqual(env["SERVICEBUS_RM_PUBLISH_DRAFT_CASEFILE_QUEUE_NAME"], queue_name)

    def test_staging_rejects_missing_or_malformed_build_numbers(self):
        for build in ["", "not-a-build", "408-invalid", "${OTHER_BUILD_NUMBER}"]:
            with self.subTest(build=build):
                with self.assertRaises(subprocess.CalledProcessError) as error:
                    render(staging=True, build=build)
                expected = "is required" if not build else "must be a Jenkins build number"
                self.assertIn(expected, error.exception.stderr)

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
