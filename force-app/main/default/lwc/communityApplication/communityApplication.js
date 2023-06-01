import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getApplication from '@salesforce/apex/CommunityApplicationController.getApplication';
import saveAnswers from '@salesforce/apex/CommunityApplicationController.saveAnswers';
import submitApplication from '@salesforce/apex/CommunityApplicationController.submitApplication';

import TEXT_ANSWER_FIELD from '@salesforce/schema/Application_Answer__c.Text_Answer__c';
import NUMBER_ANSWER_FIELD from '@salesforce/schema/Application_Answer__c.Text_Answer__c';
import DATE_ANSWER_FIELD from '@salesforce/schema/Application_Answer__c.Text_Answer__c';

export default class CommunityApplication extends LightningElement {
    @api recordId;
    error;

    isLoading = false;
    cardIconName = 'standard:form';

    textAnswerField = TEXT_ANSWER_FIELD;
    numberAnswerField = NUMBER_ANSWER_FIELD;
    dateAnswerField = DATE_ANSWER_FIELD;

    wiredApplication = [];
    application;
    answers;
    submitResult = '';


    /*********************************
     * Form display variables
     *********************************/

    isPaginated = false;
    maxQuestionsPerPage = 5;
    currentPage = 1;
    totalPages;
    currentPageAnswers;


    /*********************************
     * Dynamic labels
     *********************************/

    get cardTitle() {
        return this.application 
            ? `${this.application.Contact__r.FirstName} ${this.application.Contact__r.LastName}'s ${this.application.Application_Template__r.Name}`
            : 'Application';
    }

    get noQuestionsMessage() {
        return this.application
            ? `There are no questions assigned to the ${this.application.Application_Template__r.Name} application template.`
            : '';
    }


    /*********************************
     * Get application
     * @param string recordId 
     *   record id of application
     * @return Application__c
     *   application record with nested application answers
     *********************************/

    @wire(getApplication, { recordId: '$recordId' })
    wiredResult(result) {
        this.isLoading = true;
        this.wiredApplication = result;
        if (result.data) {
            // Parse data
            let app = JSON.parse( JSON.stringify(result.data) );
            // Set additional answer properties for data type and help text
            app.Application_Answers__r.forEach(ans => {
                this.setDataType(ans);
                ans.helpText = ans.Source_Question__r.Help_Text__c ? ans.Source_Question__r.Help_Text__c : null;
            });
            // Store application obj and answers in a separate array
            this.application = app;
            this.answers = app.Application_Answers__r;
            // Set navigation settings
            this.isPaginated = app.Application_Template__r.Paginated__c;
            this.maxQuestionsPerPage = app.Application_Template__r.Number_of_Questions_per_Page__c != null 
                ? app.Application_Template__r.Number_of_Questions_per_Page__c 
                : 5;
            this.totalPages = Math.ceil(this.answers.length / this.maxQuestionsPerPage);
            this.updateCurrentPageQuestions();

            this.error = undefined;
            this.isLoading = false;
        } else if (result.error) {
            this.error = result.error;
            console.error(this.error);
            this.application = undefined;
            this.isLoading = false;
        }
    }


    /*********************************
     * Set data type for each answer. Maps picklist value to supported
     *   value for lightning-input's 'type' attribute
     * @param obj answer 
     * @return void
     *********************************/

    setDataType(answer) {
        let type = 'Text';
        switch (answer.Field_Type__c) {
            case 'Text':
                type = 'text'
                break;
            case 'Number':
                type = 'number'
                break;
            case 'Date':
                type = 'date'
                break;
        }
        answer.type = type;
    }

    /*********************************
     * Handle input
     *********************************/

    handleInputChange(event) {
        const { name, value } = event.target;
        const answerId = name.substring(name.indexOf('_') + 1);
        const updatedAnswers = this.answers.map((answer) => {
            if (answer.Id === answerId) {
                return { ...answer, Answer__c: value };
            }
            return answer;
        });
        this.answers = updatedAnswers;
    }


    handleSaveAnswers() {
        // TODO - validate input

        const records = this.answers.map((ans) => {
            let answer = {
                Id: ans.Id,
                Answer__c: String(ans.Answer__c)
            }
            return answer;
        });

        saveAnswers({ records: records })
            .then(() => {
                console.log('Answers are saved');
                // Handle success message
                const event = new ShowToastEvent({
                    title: 'Success',
                    message: 'Thank you for your submission, but it is lousy. We have thrown it in the trash.',
                    variant: 'success'
                });
                this.dispatchEvent(event);
            })
            .catch((error) => {
                this.error = error;
                // Handle error
                const event = new ShowToastEvent({
                    title: 'An error occurred',
                    message: 'The application could not be saved',
                });
                this.dispatchEvent(event);
            });

    }

    handleSubmitApplication() {

        const records = this.answers.map((ans) => {
            let answer = {
                Id: ans.Id,
                Answer__c: ans.Answer__c, 
                Field_Type__c: ans.Field_Type__c
            }
            return answer;
        });
        
        submitApplication({ recordId: this.recordId, lstAnswerObjects: records })
            .then(() => {
                const event = new ShowToastEvent({
                    title: 'Success',
                    message: 'Thank you for your submission, but it is lousy. We have thrown it in the trash.',
                    variant: 'success'
                });
                this.dispatchEvent(event);
            })
            .catch((error) => {
                this.error = error;
                console.error(this.error);
                const event = new ShowToastEvent({
                    title: 'Oh no. It has not done the thing',
                    message: 'This did not go well.',
                    variant: 'error'
                });
                this.dispatchEvent(event);
            });
    }

    /*********************************
     * Handle navigation
     *********************************/

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updateCurrentPageQuestions();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updateCurrentPageQuestions();
        }
    }

    updateCurrentPageQuestions() {
        const startIndex = (this.currentPage - 1) * this.maxQuestionsPerPage;
        const endIndex = startIndex + this.maxQuestionsPerPage;
        this.currentPageAnswers = this.answers.slice(startIndex, endIndex);
    }

    get disablePreviousButton() {
        return this.currentPage === 1;
    }

    get disableNextButton() {
        return this.currentPage === this.totalPages;
    }

}