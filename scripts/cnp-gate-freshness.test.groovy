// Run with a caller-provided Groovy 4 classpath; no Jenkins or browser installation is required.
import org.codehaus.groovy.ast.CodeVisitorSupport
import org.codehaus.groovy.ast.expr.MethodCallExpression
import org.codehaus.groovy.control.SourceUnit
import java.nio.file.Files

File repository = new File(args ? args[0] : '.').canonicalFile
String text = new File(repository, 'Jenkinsfile_CNP').text
List<String> lines = text.readLines()
def source = SourceUnit.create('Jenkinsfile_CNP', text)
source.parse(); source.completePhase(); source.nextPhase(); source.convert()
def extract = { node ->
    def selected = lines.subList(node.lineNumber - 1, node.lastLineNumber).collect()
    selected[-1] = selected[-1].substring(0, node.lastColumnNumber - 1)
    selected[0] = selected[0].substring(node.columnNumber - 1)
    selected.join('\n')
}
Map hooks = [:]
source.AST.statementBlock.visit(new CodeVisitorSupport() {
    void visitMethodCallExpression(MethodCallExpression call) {
        String method = call.methodAsString
        def arguments = call.arguments.expressions
        if (method in ['before', 'afterAlways'] && arguments.size() == 2 &&
            arguments[0].text in ['stageTest', 'stageFunctionalDev', 'stageFunctionalStg']) {
            hooks["${method}:${arguments[0].text}".toString()] = extract(call)
        }
        // Evaluate the real registration loop too: later before callbacks replace earlier ones in Infrastructure.
        if (method == 'each' && call.objectExpression.text == '[stageFunctionalStg, fullFunctionalTest:stg]') {
            hooks['stagingRegistration'] = extract(call)
        }
        super.visitMethodCallExpression(call)
    }
})
def methods = source.AST.methods.findAll { it.name in [
    'prepareReportAttempt', 'snapshotZephyrReports', 'archiveArtifact', 'publishHtmlReport',
    'resolvedBrowserToRun', 'defaultBrowser', 'functionalOutputDir', 'functionalReportFile',
    'functionalReportName', 'smokeOutputDir', 'smokeReportFile', 'smokeReportName', 'shouldPublishSmokeReport'
] }.collect(extract).join('\n')
assert hooks.size() == 5 : hooks.keySet()
def loader = new GroovyClassLoader(getClass().classLoader)
loader.parseClass('''package hudson
class AbortException extends RuntimeException {
    AbortException(String message) { super(message) }
}''')
loader.parseClass('''package uk.gov.hmcts.pipeline
class AKSSubscriptions {
    AKSSubscriptions(Object script) { }
    def aat = [name: 'aat']
}''')
loader.parseClass('''package uk.gov.hmcts.contino
class Kubectl {
    Kubectl(Object... arguments) { }
    void login() { }
}''')
def abort = { message -> loader.loadClass('hudson.AbortException').getConstructor(String).newInstance(message) }
int scenarios = 0
for (String stage : ['stageTest', 'stageFunctionalDev', 'stageFunctionalStg']) {
    for (String failure : ['metadata', 'reporting', 'prepare', 'none', * (stage == 'stageTest' ? ['skip'] : [])]) {
        File workspace = Files.createTempDirectory('cnp-freshness-').toFile()
        try {
            def write = { String name, String value ->
                File file = new File(workspace, name); file.parentFile.mkdirs(); file.text = value
            }
            List stale = [
                'cypress/reports/smokeXmlReport.html', 'cypress/reports/functionalXmlReport.html',
                'functional-output/component/edge/html/component-report.html',
                'functional-output/component/edge/json/result.json',
                'functional-output/component/edge/junit/result.xml',
                'functional-output/prod/edge/cucumber/edge-report.html',
                'functional-output/prod/edge/cucumber/OPAL-report-1.ndjson',
                'functional-output/prod/edge/result.xml',
                'functional-output/screenshots/edge/old.png',
                'functional-output/zephyr/cypress-report-1.json',
                'functional-output/zephyr/cucumber-report.json',
                'smoke-output/prod/edge/cucumber/smoke-report.html',
                'smoke-output/prod/edge/cucumber/OPAL-report-1.ndjson',
                'smoke-output/zephyr/cucumber-report.json', 'smoke-output/screenshots/old.png'
            ]
            List preserved = ['functional-output/account_evidence/created-accounts.json',
                'functional-output/creation-ledger.json', 'functional-output/cleanup-receipts.json',
                'functional-output/unknown/data.json', 'archives/previous-stage/report.html']
            stale.each { write(it, 'STALE') }; preserved.each { write(it, "KEEP:${it}") }
            List events = []; List published = []; List archived = []; Map registered = [:]
            Map build = [result: 'SUCCESS']; def caught
            def execute = { String command ->
                if (command.contains('kubectl wait')) {
                    events << 'readiness'
                    return 0
                }
                events << (command.endsWith(' prepare') ? 'prepare' : 'packaging')
                if (command.endsWith(' prepare') && failure == 'prepare') {
                    new File(workspace, 'functional-output/zephyr').deleteDir()
                    throw abort('prepare')
                }
                if (command.contains(' snapshot ') && failure in ['metadata', 'reporting']) {
                    stale.each { assert !new File(workspace, it).exists() : "stale before finalizer: ${it}" }
                }
                String local = command.replace('node scripts/test-report-artifacts.cjs',
                    "node '${new File(repository, 'scripts/test-report-artifacts.cjs')}'")
                Process process = new ProcessBuilder('sh', '-c', local)
                    .directory(workspace).redirectErrorStream(true).start()
                String output = process.inputStream.text
                int status = process.waitFor()
                if (status) throw abort("command failed: ${output}")
                0
            }
            def runBrowser = {
                events << 'browser'
                write('functional-output/zephyr/cypress-report-1.json', 'FRESH')
                write(stage == 'stageTest' ? 'functional-output/component/edge/html/component-report.html' :
                    'functional-output/prod/edge/cucumber/edge-report.html', 'FRESH')
                if (stage != 'stageTest') write('smoke-output/prod/edge/cucumber/smoke-report.html', 'FRESH')
            }
            def yarn = { String command ->
                String gate = command == 'check:cypress:test-metadata' ? 'metadata' :
                    command == 'test:reporting' ? 'reporting' : 'browser'
                if (gate == 'browser') { runBrowser(); return }
                events << gate
                if (gate == failure) throw abort(gate)
            }
            Binding binding = new Binding([
                yarnBuilder: new Expando(yarn: yarn), env: [BROWSER_TO_RUN: 'edge', SKIP_SMOKE: 'false',
                    TEAM_NAMESPACE: 'opal', BUILD_NUMBER: '123'], product: 'opal', component: 'rm-frontend',
                currentBuild: build, projectLabels: failure == 'skip' ? ['skip_opal_component'] : [],
                stageTest: 'test', stageFunctionalDev: 'dev', stageFunctionalStg: 'stg',
                skipLabelComponent: 'skip_opal_component', functionalArtifactsGlob: 'functional-output/**',
                accountArtifactPath: 'functional-output/account_evidence/created-accounts.json',
                accountEvidenceArtifacts: 'functional-output/account_evidence/**',
                browserEdge: 'edge', stringFalse: 'false', stringTrue: 'true',
                before: { name, closure -> registered["before:${name}".toString()] = closure },
                afterAlways: { name, closure -> registered["afterAlways:${name}".toString()] = closure },
                script: { closure -> closure() }, echo: { message -> },
                withAksClient: { subscription, environment, productName, closure -> closure() },
                withEnv: { values, closure -> closure() },
                sh: { command -> execute(command instanceof Map ? command.script.toString() : command.toString()) },
                archiveArtifacts: { Map options ->
                    events << 'archive'
                    String root = options.artifacts.replaceFirst(/\/\*\*$/, '').replaceFirst(/\/\*\.json$/, '')
                    File file = new File(workspace, root)
                    if (file.isDirectory()) file.eachFileRecurse { if (it.isFile()) archived << it.text }
                    else if (file.isFile()) archived << file.text
                },
                publishHTML: { Map options ->
                    events << 'publish'
                    File file = new File(workspace, "${options.target.reportDir}/${options.target.reportFiles}")
                    if (file.exists()) published << file.text
                }
            ])
            // Start with an earlier attempt marked prepared to prove failure resets the guard.
            String preamble = 'import groovy.transform.Field\n' +
                'import uk.gov.hmcts.contino.Kubectl\nimport uk.gov.hmcts.pipeline.AKSSubscriptions\n' +
                '@Field Map reportAttemptsPrepared = [component:true, functional:true]\n'
            new GroovyShell(loader, binding).evaluate(preamble + methods + '\n' + hooks.values().join('\n'))
            String name = stage == 'stageTest' ? 'test' : stage == 'stageFunctionalDev' ? 'dev' : 'stg'
            if (stage != 'stageTest') {
                try { registered["before:${name}"](); runBrowser() }
                catch (Exception error) {
                    caught = error; build.result = 'FAILURE'
                    // Before the unconditional functional finalizer, gated attempts contain no stale source reports.
                    if (failure != 'prepare') {
                        stale.each {
                            assert !new File(workspace, it).exists() : "stale before finalizer: ${it}"
                        }
                    }
                }
            }
            registered["afterAlways:${name}"]()
            preserved.each { assert new File(workspace, it).text == "KEEP:${it}" }
            if (failure == 'skip') {
                assert events.empty; stale.each { assert new File(workspace, it).text == 'STALE' }
            } else {
                assert events[0] == 'prepare' : "${stage}/${failure}: ${events}"
                if (failure == 'none') {
                    List expected = ['prepare', 'metadata', 'reporting'] +
                        (stage == 'stageFunctionalStg' ? ['readiness'] : []) + ['browser']
                    assert events.take(expected.size()) == expected
                    assert published.size() == (stage == 'stageTest' ? 1 : 2)
                    assert published.every { it == 'FRESH' }
                    assert archived.contains('FRESH')
                    if (stage == 'stageTest') {
                        File snapshot = new File(workspace,
                            'functional-output/component/edge/zephyr/cypress-report-1.json')
                        assert snapshot.text == 'FRESH'
                    }
                    assert build.result == 'SUCCESS'
                    if (stage == 'stageFunctionalStg') {
                        int previousEvents = events.size()
                        registered['before:fullFunctionalTest:stg']()
                        assert events.drop(previousEvents) == ['readiness']
                    }
                } else {
                    assert events.take(failure == 'prepare' ? 1 : failure == 'metadata' ? 2 : 3) ==
                        (failure == 'prepare' ? ['prepare'] : failure == 'metadata' ? ['prepare', 'metadata'] :
                            ['prepare', 'metadata', 'reporting'])
                    assert !events.contains('browser')
                    assert !events.contains('readiness')
                    assert published.empty : "stale published: ${published}"
                    assert !archived.contains('STALE')
                    assert build.result == 'FAILURE'
                    if (stage != 'stageTest') assert caught.message == failure
                    if (failure == 'prepare') assert !events.contains('publish') && !events.contains('archive')
                    if (stage == 'stageTest' && failure != 'prepare') {
                        assert !new File(workspace, 'functional-output/component/edge/zephyr').exists()
                        assert !new File(workspace,
                            'functional-output/component/edge/html/component-report.html').exists()
                    }
                }
            }
            scenarios++
            println "PASS ${stage}/${failure}"
        } finally { workspace.deleteDir() }
    }
}
println "${scenarios} actual-hook freshness scenarios passed"
