const chalk = require('chalk');
const semver = require('semver');
const _ = require('lodash');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');
const packagejs = require('../../package.json');

module.exports = class extends BaseGenerator {
    get initializing() {
        return {
            init(args) {
                if (args === 'default') {
                    // do something when argument is 'default'
                }
            },
            readConfig() {
                try {
                    this.jhipsterAppConfig = this.getAllJhipsterConfig();
                } catch (TypeError) {
                    this.jhipsterAppConfig = this.getJhipsterAppConfig();
                }

                if (!this.jhipsterAppConfig) {
                    this.error('Can\'t read .yo-rc.json');
                }
            },
            displayLogo() {
                // it's here to show that you can use functions from generator-jhipster
                // this function is in: generator-jhipster/generators/generator-base.js
                this.printJHipsterLogo();

                // Have Yeoman greet the user.
                this.log(`\nWelcome to the ${chalk.bold.yellow('JHipster apiutils')} generator! ${chalk.yellow(`v${packagejs.version}\n`)}`);
            },
            checkJhipster() {
                const currentJhipsterVersion = this.jhipsterAppConfig.jhipsterVersion;
                const minimumJhipsterVersion = packagejs.dependencies['generator-jhipster'];
                if (!semver.satisfies(currentJhipsterVersion, minimumJhipsterVersion)) {
                    this.warning(`\nYour generated project used an old JHipster version (${currentJhipsterVersion})... you need at least (${minimumJhipsterVersion})\n`);
                }
            },
            checkSwaggerEnabled() {
                if (!this.jhipsterAppConfig.enableSwaggerCodegen) {
                    this.error('Can\'t use this module without enabling swagger codegen. Please edit your .yo-rc.json file and set enableSwaggerCodegen to true');
                }
            }
        };
    }

    get prompting() {
        return {
            askOpenApiPath: function askOpenApiPath() {
                const done = this.async();

                this.serviceDiscoveryType = this.jhipsterAppConfig.serviceDiscoveryType;
                const prompts = [{
                    type: 'input',
                    name: 'openApiPath',
                    message: 'Which api base path is used for openapi endpoint?',
                    default: '/api/public',
                    store: true
                },
                {
                    when: this.serviceDiscoveryType === 'consul' || this.serviceDiscoveryType === 'eureka',
                    type: 'confirm',
                    name: 'addServiceDiscoveryTag',
                    message: 'Do you want add version tags for service discovery?',
                    default: false,
                }
                ];


                this.prompt(prompts).then((props) => {
                    this.openApiPath = props.openApiPath;
                    this.addServiceDiscoveryTag = props.addServiceDiscoveryTag;
                    done();
                });
            },

            askFabioTags: function askFabioTags() {
                const done = this.async();

                this.serviceDiscoveryType = this.jhipsterAppConfig.serviceDiscoveryType;
                const prompts = [{
                    when: this.serviceDiscoveryType === 'consul' || this.addServiceDiscoveryTag === true,
                    type: 'confirm',
                    name: 'addFabioTags',
                    message: 'Do you want add urlprefix tags for Fabio service discovery?',
                    default: false,
                }];

                this.prompt(prompts).then((props) => {
                    this.addFabioTags = props.addFabioTags;
                    done();
                });
            },

            askSwaggerUIUpgrade: function askSwaggerUIUpgrade() {
                const done = this.async();

                const prompts = [{
                    when: this.jhipsterAppConfig.authenticationType === 'jwt' && (this.jhipsterAppConfig.applicationType === 'monolith' || this.jhipsterAppConfig.applicationType === 'gateway'),
                    type: 'confirm',
                    name: 'swaggerUi3',
                    message: 'Do you want to upgrade swagger UI to version 3? (Beta - works only with JWT auth)',
                    default: false,
                }];

                this.prompt(prompts).then((props) => {
                    this.swaggerUi3 = props.swaggerUi3;
                    done();
                });
            }
        };
    }

    writing() {
        // function to use directly template
        this.template = (source, destination) => this.fs.copyTpl(
            this.templatePath(source),
            this.destinationPath(destination),
            this
        );

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

        this.dasherizedBaseName = _.kebabCase(this.baseName);
        this.openApiBasePathProperty = `$\{openapi.${this.dasherizedBaseName}.base-path:${this.openApiPath}}`;

        this.log(`\ngenerating api first files for api.yml exposed on public path ${this.openApiPath} or set on property ${this.openApiBasePathProperty}\n`);

        this.template(
            `${jhipsterConstants.SERVER_MAIN_SRC_DIR}package/web/_OpenApiController.java.ejs`,
            `${javaDir}web/OpenApiController.java`
        );
        this.template(
            `${jhipsterConstants.SERVER_MAIN_SRC_DIR}package/service/_OpenApiService.java.ejs`,
            `${javaDir}service/OpenApiService.java`
        );
        this.template(
            `${jhipsterConstants.SERVER_MAIN_SRC_DIR}package/config/apidocs/_ApiFirstResourceProvider.java.ejs`,
            `${javaDir}config/apidocs/ApiFirstResourceProvider.java`
        );
        this.template(
            `${jhipsterConstants.SERVER_MAIN_SRC_DIR}package/config/apidocs/_ApiVersionContributor.java.ejs`,
            `${javaDir}config/apidocs/ApiVersionContributor.java`
        );

        if (this.buildTool === 'maven') {
            this.addMavenProperty('jackson.version', '2.9.8');
            this.addMavenDependencyInDirectory('', 'com.fasterxml.jackson.dataformat', 'jackson-dataformat-yaml', '${jackson.version}');
            this.rewriteFile('pom.xml',
                '<delegatePattern>true</delegatePattern>',
                `<title>${this.dasherizedBaseName}</title>`);
        } else if (this.buildTool === 'gradle') {
            this.addGradleProperty('jackson_version', '2.9.8');
            this.addGradleDependencyInDirectory('', 'compile', 'com.fasterxml.jackson.dataformat', 'jackson-dataformat-yaml', '${jackson_version}');
            this.replaceContent('gradle/swagger.gradle', 'delegatePattern: "true"', `delegatePattern: "true", title: "${this.dasherizedBaseName}"`);
        }

        if (this.addServiceDiscoveryTag) {
            if (this.serviceDiscoveryType === 'consul') {
                this.template(
                    `${jhipsterConstants.SERVER_MAIN_SRC_DIR}package/config/apidocs/_ApiFirstConsulCustomizer.java.ejs`,
                    `${javaDir}config/apidocs/ApiFirstConsulCustomizer.java`
                );
                if (this.addFabioTags) {
                    this.template(
                        `${jhipsterConstants.MAIN_DIR}docker/consul-fabio.yml`,
                        `${jhipsterConstants.MAIN_DIR}docker/consul-fabio.yml`,
                    );
                }
            } else if (this.serviceDiscoveryType === 'eureka') {
                this.template(
                    `${jhipsterConstants.SERVER_MAIN_SRC_DIR}package/config/apidocs/_ApiFirstEurekaCustomizer.java.ejs`,
                    `${javaDir}config/apidocs/ApiFirstEurekaCustomizer.java`
                );
            }
        }

        if (this.swaggerUi3) {
            if (this.enableTranslation === undefined) {
                this.enableTranslation = true;
            }
            this.CLIENT_MAIN_SRC_DIR = jhipsterConstants.CLIENT_MAIN_SRC_DIR;
            this.MAIN_SRC_DIR = jhipsterConstants.CLIENT_MAIN_SRC_DIR;
            this.BUILD_DIR = this.getBuildDirectoryForBuildTool(this.buildTool);

            this.template(
                `${jhipsterConstants.CLIENT_MAIN_SRC_DIR}swagger-ui/index.html`,
                `${jhipsterConstants.CLIENT_MAIN_SRC_DIR}swagger-ui/index.html`
            );

            this.template(
                `${jhipsterConstants.CLIENT_MAIN_SRC_DIR}swagger-ui/jquery-2.2.4.min.js`,
                `${jhipsterConstants.CLIENT_MAIN_SRC_DIR}swagger-ui/jquery-2.2.4.min.js`
            );

            if (this.clientFramework === 'angularX') {
                this.template(
                    'angular/webpack/webpack-common.js.ext.ejs',
                    `${jhipsterConstants.CLIENT_WEBPACK_DIR}/webpack.common.js`
                );
            } else if (this.clientFramework === 'react') {
                this.template(
                    'react/webpack/webpack-common.js.ext.ejs',
                    `${jhipsterConstants.CLIENT_WEBPACK_DIR}/webpack.common.js`
                );
            }
        }
    }

    install() {
        let logMsg = `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install`)}`;

        if (this.clientFramework === 'angular1') {
            logMsg = `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install & bower install`)}`;
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

        const packageJson = require(this.destinationPath('package.json'));

        if (this.swaggerUi3) {
            if (installConfig.npm) {
                this.spawnCommand('npm', ['install', '--save', 'swagger-ui-dist']);
                this.spawnCommand('npm', ['uninstall', '--save', 'swagger-ui']);
            } else if (installConfig.yarn) {
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
        this.log('End of apiutils generator');
    }
};
