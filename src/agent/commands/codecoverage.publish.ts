import cm = require('../common');
import ccp = require('../codecoveragepublisher');
import ccsr = require('../codecoveragesummaryreader');

var Q = require('q');

//-----------------------------------------------------
// Publishes results from a specified file to TFS server 
// - CMD_PREFIX + "codecoverage.publish type=junit]" + testResultsFile
//-----------------------------------------------------

export function createAsyncCommand(executionContext: cm.IExecutionContext, command: cm.ITaskCommand) {
    return new CodeCoveragePublishCommand(executionContext, command);
}

export class CodeCoveragePublishCommand implements cm.IAsyncCommand {
    constructor(executionContext: cm.IExecutionContext, command: cm.ITaskCommand) {
        this.command = command;
        this.executionContext = executionContext;
        this.description = "CodeCoverage.Publish async Command";
    }

    public command: cm.ITaskCommand;
    public executionContext: cm.IExecutionContext;
    public description: string;

    public runCommandAsync() : Q.Promise<any> {
        var defer = Q.defer();

        var codeCoverageTool: string = this.command.properties['codecoveragetool'];

        var reader;
        if(!codeCoverageTool)
        {
            // print an error message and return
            var err = new Error("No code coverage tool provided");
            defer.reject(err);
        }
        
        switch(codeCoverageTool.toLowerCase())
        {
            case "jacoco":
                reader = new ccsr.JacocoSummaryReader(this.command);
            case "cobertura":
                reader = new ccsr.CoberturaSummaryReader(this.command);
            default :
                // print an error message and return
                var err = new Error("Code coverage tool not supported");
                defer.reject(err);
        }
        
        var testRunPublisher = new ccp.CodeCoveragePublisher(this.executionContext, this.command, reader);
        testRunPublisher.publishCodeCoverage().then(function(response) {
            defer.resolve("Success");
        }).fail((err) => {
            defer.reject(err);
        });       

        return defer.promise;
    }
}