const chalk = require('chalk');
const packagejs = require('../../package.json');
const semver = require('semver');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');

module.exports = class extends BaseGenerator {
    get initializing() {
        return {
            init(args) {
                if (args === 'default') {
                    // do something when argument is 'default'
                }
            },
            readConfig() {
                this.jhipsterAppConfig = this.getJhipsterAppConfig();
                if (!this.jhipsterAppConfig) {
                    this.error('Can\'t read .yo-rc.json');
                }
            },
            displayLogo() {
                // it's here to show that you can use functions from generator-jhipster
                // this function is in: generator-jhipster/generators/generator-base.js
                this.printJHipsterLogo();

                // Have Yeoman greet the user.
                this.log(`\nWelcome to the ${chalk.bold.yellow('JHipster apifirst')} generator! ${chalk.yellow(`v${packagejs.version}\n`)}`);
            },
            checkJhipster() {
                const currentJhipsterVersion = this.jhipsterAppConfig.jhipsterVersion;
                const minimumJhipsterVersion = packagejs.dependencies['generator-jhipster'];
                if (!semver.satisfies(currentJhipsterVersion, minimumJhipsterVersion)) {
                    this.warning(`\nYour generated project used an old JHipster version (${currentJhipsterVersion})... you need at least (${minimumJhipsterVersion})\n`);
                }
            }
        };
    }

    prompting() {
        const prompts = [
            {
                type: 'input',
                name: 'openApiFile',
                message: 'What what is the name of the openapi file in the swagger directory?',
                default: 'api.yml',
                store: true
            },
            {
                type: 'input',
                name: 'openApiPath',
                message: 'Which api base path is used for openapi?',
                default: '/api/public',
                store: true
            }
        ];

        this.serviceDiscoveryType = this.jhipsterAppConfig.serviceDiscoveryType;
        if(this.serviceDiscoveryType === 'consul' || this.serviceDiscoveryType === 'eureka'){
            prompts.push({
                type: 'confirm',
                name: 'addServiceDiscoveryTag',
                message: 'Do you want add an api version tag for service discovery?',
                default: false,
            })
        }

        if(this.jhipsterAppConfig.applicationType === 'monolith' || this.jhipsterAppConfig.applicationType === 'gateway') {
            prompts.push({
                type: 'confirm',
                name: 'swaggerUi3',
                message: 'Do you want to upgrade swagger UI to version 3? (Beta - works only with JWT auth)',
                default: false,
            })
        }

        const done = this.async();
        this.prompt(prompts).then((props) => {
            this.props = props;
            // To access props later use this.props.someOption;

            done();
        });
    }

    writing() {
        // function to use directly template
        this.template = function (source, destination) {
            this.fs.copyTpl(
                this.templatePath(source),
                this.destinationPath(destination),
                this
            );
        };

        // read config from .yo-rc.json
        this.baseName = this.jhipsterAppConfig.baseName;
        this.packageName = this.jhipsterAppConfig.packageName;
        this.packageFolder = this.jhipsterAppConfig.packageFolder;
        this.clientFramework = this.jhipsterAppConfig.clientFramework;
        this.clientPackageManager = this.jhipsterAppConfig.clientPackageManager;
        this.buildTool = this.jhipsterAppConfig.buildTool;
        this.jhipsterVersion = this.jhipsterAppConfig.jhipsterVersion;
        this.swaggerEnabled = this.jhipsterAppConfig.enableSwaggerCodegen;


        // use function in generator-base.js from generator-jhipster
        this.angularAppName = this.getAngularAppName();

        // use constants from generator-constants.js
        const javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
        const webappDir = jhipsterConstants.CLIENT_MAIN_SRC_DIR;

        this.log(`\ngenerating api first files for ${this.props.openApiFile} exposed on public path ${this.props.openApiPath}\n`);

        this.template(
            `${jhipsterConstants.SERVER_MAIN_SRC_DIR}package/web/_OpenApiController.java.ejs`,
            `${javaDir}web/OpenApiController.java`
        )
        this.template(
            `${jhipsterConstants.SERVER_MAIN_SRC_DIR}package/service/_OpenApiService.java.ejs`,
            `${javaDir}service/OpenApiService.java`
        )
        this.template(
            `${jhipsterConstants.SERVER_MAIN_SRC_DIR}package/config/apidocs/_ApiFirstResourceProvider.java.ejs`,
            `${javaDir}config/apidocs/ApiFirstResourceProvider.java`
        )

        if (this.buildTool === 'maven') {
            this.addMavenProperty("jackson.version", "2.9.8");
            this.addMavenDependencyInDirectory("", "com.fasterxml.jackson.dataformat", "jackson-dataformat-yaml", "${jackson.version}");
        } else if (this.buildTool === 'gradle') {
            this.addGradleProperty("jackson.version", "2.9.8");
            this.addGradleDependencyInDirectory("", 'compile', "com.fasterxml.jackson.dataformat", "jackson-dataformat-yaml", "${jackson.version}");
        }

        if(this.props.addServiceDiscoveryTag){
            if(this.serviceDiscoveryType === 'consul'){
                this.template(
                    `${jhipsterConstants.SERVER_MAIN_SRC_DIR}package/config/apidocs/_ApiFirstConsulCustomizer.java.ejs`,
                    `${javaDir}config/apidocs/ApiFirstConsulCustomizer.java`
                )
            } else if(this.serviceDiscoveryType == 'eureka'){
                this.template(
                    `${jhipsterConstants.SERVER_MAIN_SRC_DIR}package/config/apidocs/_ApiFirstEurekaCustomizer.java.ejs`,
                    `${javaDir}config/apidocs/ApiFirstEurekaCustomizer.java`
                )
            }
        }

        if(this.props.swaggerUi3){

            //settings vars needed by webpack-common.js template
            if (this.enableTranslation === undefined) {
                this.enableTranslation = true;
            }
            this.MAIN_SRC_DIR = jhipsterConstants.CLIENT_MAIN_SRC_DIR;

            this.template(
                `${jhipsterConstants.CLIENT_MAIN_SRC_DIR}swagger-ui/index.html`,
                `${jhipsterConstants.CLIENT_MAIN_SRC_DIR}swagger-ui/index.html`
            )
    
            this.template(
                `${jhipsterConstants.CLIENT_MAIN_SRC_DIR}swagger-ui/jquery-2.2.4.min.js`,
                `${jhipsterConstants.CLIENT_MAIN_SRC_DIR}swagger-ui/jquery-2.2.4.min.js`
            )
    
            if(this.clientFramework === 'angularX') {
                this.template(
                    `angular/webpack/webpack-common.js.ext.ejs`,
                    `${jhipsterConstants.CLIENT_WEBPACK_DIR}/webpack.common.js`
                )
            } else if(this.clientFramework === 'react') {
                this.template(
                    `react/webpack-common.js.ext.ejs`,
                    `${jhipsterConstants.CLIENT_WEBPACK_DIR}/webpack.common.js`
                )
            }
    
        }
       
    }

    install() {
        let logMsg =
            `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install`)}`;

        if (this.clientFramework === 'angular1') {
            logMsg =
                `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install & bower install`)}`;
        }
        const injectDependenciesAndConstants = (err) => {
            if (err) {
                this.warning('Install of dependencies failed!');
                this.log(logMsg);
            } else if (this.clientFramework === 'angular1') {
                this.spawnCommand('gulp', ['install']);
            }
        };
        const installConfig = {
            bower: this.clientFramework === 'angular1',
            npm: this.clientPackageManager !== 'yarn',
            yarn: this.clientPackageManager === 'yarn',
            callback: injectDependenciesAndConstants
        };

        const packageJson = require(this.destinationPath("package.json"))
        
        if(this.props.swaggerUi3){
            if(installConfig.npm){
                this.spawnCommand('npm', ['install', '--save', 'swagger-ui-dist']);
                this.spawnCommand('npm', ['uninstall', '--save', 'swagger-ui']);
            } else if (installConfig.yarn){
                this.spawnCommand('yarn', ['install', '--save', 'swagger-ui-dist']);
                this.spawnCommand('yarn', ['uninstall', '--save', 'swagger-ui']);
            }
        }
        

        if (this.options['skip-install']) {
            this.log(logMsg);
        } else {
            this.installDependencies(installConfig);
        }
    }

    end() {
        this.log('End of apifirst generator');
    }
};
