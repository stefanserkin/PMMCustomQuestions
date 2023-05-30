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
                       (SELECT Id, 
                               Name, 
                               Sort_Order__c, 
                               Question__c, 
                               Answer__c, 
                               Source_Question__c, 
                               Source_Question__r.Name, 
                               Source_Question__r.Field_Type__c, 
                               Source_Question__r.Help_Text__c, 
                               Source_Question__r.Min_Selectable_Options__c, 
                               Source_Question__r.Max_Selectable_Options__c, 
                               Source_Question__r.Options__c
                          FROM Application_Answers__r)
                  FROM Application__c
                 WHERE Id = :recordId
                 LIMIT 1
            ];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

}