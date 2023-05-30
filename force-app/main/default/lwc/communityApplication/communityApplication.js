import { LightningElement, api, wire } from 'lwc';
import getApplication from '@salesforce/apex/CommunityApplicationController.getApplication';

export default class CommunityApplication extends LightningElement {
    @api recordId;
    error;

    isLoading = false;
    cardIconName = 'standard:form';

    wiredApplication = [];
    application;

    /**
     * Card title is displayed on every application page
     */
    get cardTitle() {
        return `Program Application`;
    }

    /**
     * Get application
     * @param string recordId 
     *   record id of application
     * @return Application__c
     *   application record with nested application answers
     */
    @wire(getApplication, { recordId: '$recordId' })
    wiredResult(result) {
        this.isLoading = true;
        this.wiredApplication = result;
        if (result.data) {
            console.table(result.data);
            this.application = result.data;
            this.error = undefined;
            this.isLoading = false;
        } else if (result.error) {
            this.error = result.error;
            console.error(this.error);
            this.application = undefined;
            this.isLoading = false;
        }
    }

}