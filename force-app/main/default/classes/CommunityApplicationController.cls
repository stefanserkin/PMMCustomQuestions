public with sharing class CommunityApplicationController {

    /************************************************************************
     * @param String recordId - the record id of the application
     * @return Application__c - application with nested application answers
     ************************************************************************/

    @AuraEnabled(cacheable=true)
    public static Application__c getApplication(String recordId) {
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
    public static void saveAnswers(List<sObject> records) {
        // Perform any necessary validation and processing

        // Save the answers to the Answer__c records associated with the questions
        List<Application_Answer__c> lstAnswersToUpdate = new List<Application_Answer__c>();
        for (sObject record : records) {
            Application_Answer__c ans = new Application_Answer__c();
            ans.Id = record.Id;
            ans.Answer__c = (String) record.get('Answer__c');
            lstAnswersToUpdate.add(ans);
        }

        if (!lstAnswersToUpdate.isEmpty()) {
            update lstAnswersToUpdate;
        }
    }

}