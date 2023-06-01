public with sharing class CommunityApplicationController {

    private static final String APPLICATION_STATUS_DRAFT = 'Draft';
    private static final String APPLICATION_STATUS_SUBMITTED = 'Submitted';

    /************************************************************************
     * @param String recordId - the record id of the application
     * @return Application__c - application with nested application answers
     ************************************************************************/

    @AuraEnabled(cacheable=true)
    public static Application__c getApplication(
        String recordId
    ) {
        try {
            return [
                SELECT Id, 
                       Name, 
                       Contact__c, 
                       Contact__r.FirstName, 
                       Contact__r.LastName, 
                       Program_Engagement__c, 
                       Application_Template__c, 
                       Application_Template__r.Name, 
                       Application_Template__r.Paginated__c, 
                       Application_Template__r.Number_of_Questions_per_Page__c, 
                       (SELECT Id, 
                               Name, 
                               Sort_Order__c, 
                               Field_Type__c, 
                               Required__c, 
                               Question__c, 
                               Answer__c, 
                               Text_Answer__c, 
                               Number_Answer__c, 
                               Date_Answer__c, 
                               Source_Question__c, 
                               Source_Question__r.Help_Text__c, 
                               Source_Question__r.Min_Selectable_Options__c, 
                               Source_Question__r.Max_Selectable_Options__c, 
                               Source_Question__r.Options__c 
                          FROM Application_Answers__r
                         ORDER BY Sort_Order__c ASC)
                  FROM Application__c
                 WHERE Id = :recordId
                 LIMIT 1
            ];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }


    /************************************************************************
     * @param sObject[] records - collection of answer objects to save
     * @return void
     ************************************************************************/

    @AuraEnabled(cacheable=false)
    public static void saveAnswers(
        List<sObject> records
    ) {
        try {
            // Cast generic sObject to list of application answers
            List<Application_Answer__c> lstAnswers = (List<Application_Answer__c>) records;
            // TODO - Perform validation

            // Update application answers
            update lstAnswers;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void submitApplication(
        String recordId, 
        List<sObject> lstAnswerObjects
    ) {
        try {
            List<Application_Answer__c> lstAnswers = (List<Application_Answer__c>) lstAnswerObjects;
            update lstAnswers;

            Application__c app = [SELECT Id, Status__c, Submitted_Date_Time__c FROM Application__c WHERE Id = :recordId LIMIT 1];
            app.Status__c = APPLICATION_STATUS_SUBMITTED;
            app.Submitted_Date_Time__c = Datetime.now();
            update app;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

}