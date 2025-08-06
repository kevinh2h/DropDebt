/**
 * Emergency Assistance Resources
 * 
 * Direct connections to help when payment is impossible.
 * No complex eligibility analysis - just immediate resources.
 */

export interface EmergencyResource {
  name: string;
  phone?: string;
  website?: string;
  description: string;
  eligibility: string;
  howToApply: string;
  urgency: 'IMMEDIATE' | 'SAME_DAY' | 'WITHIN_WEEK';
}

export interface CrisisResponse {
  severity: 'EMERGENCY' | 'CRISIS' | 'URGENT';
  immediateActions: string[];
  phoneNumbers: string[];
  onlineResources: string[];
  localResources: string[];
  followUpSteps: string[];
}

/**
 * Emergency Assistance Provider - connects users to immediate help
 */
export class EmergencyAssistance {
  
  /**
   * Get emergency response based on crisis situation
   */
  getCrisisResponse(
    unpaidCriticalBills: number,
    unpaidAmount: number,
    billTypes: string[],
    availableAmount: number
  ): CrisisResponse {
    
    const severity = this.assessCrisisSeverity(
      unpaidCriticalBills,
      unpaidAmount,
      billTypes,
      availableAmount
    );
    
    return {
      severity,
      immediateActions: this.getImmediateActions(severity, billTypes),
      phoneNumbers: this.getEmergencyPhones(billTypes),
      onlineResources: this.getOnlineResources(billTypes),
      localResources: this.getLocalResources(billTypes),
      followUpSteps: this.getFollowUpSteps(severity)
    };
  }
  
  /**
   * Assess crisis severity level
   */
  private assessCrisisSeverity(
    unpaidCriticalBills: number,
    unpaidAmount: number,
    billTypes: string[],
    availableAmount: number
  ): 'EMERGENCY' | 'CRISIS' | 'URGENT' {
    
    const hasUtilities = billTypes.some(type => 
      ['electric', 'gas', 'water'].includes(type)
    );
    
    const hasHousing = billTypes.some(type => 
      ['rent', 'mortgage'].includes(type)
    );
    
    if (hasUtilities && hasHousing && availableAmount < unpaidAmount * 0.25) {
      return 'EMERGENCY'; // Housing + utilities at risk, very little money
    }
    
    if (unpaidCriticalBills >= 3 || (hasUtilities && availableAmount < 100)) {
      return 'CRISIS'; // Multiple critical bills or utilities with no money
    }
    
    return 'URGENT'; // Some critical bills but manageable
  }
  
  /**
   * Get immediate actions based on severity
   */
  private getImmediateActions(severity: string, billTypes: string[]): string[] {
    const actions: string[] = [];
    
    switch (severity) {
      case 'EMERGENCY':
        actions.push('Call 2-1-1 RIGHT NOW for emergency assistance');
        actions.push('Contact each utility company TODAY to prevent shutoff');
        actions.push('If facing eviction, call local legal aid immediately');
        actions.push('Apply for emergency food assistance');
        break;
        
      case 'CRISIS':
        actions.push('Call 2-1-1 within 24 hours for assistance programs');
        actions.push('Contact creditors to explain situation and request payment plans');
        actions.push('Apply for utility assistance programs (LIHEAP) if eligible');
        actions.push('Look into local emergency financial assistance');
        break;
        
      case 'URGENT':
        actions.push('Call 2-1-1 this week to identify assistance programs');
        actions.push('Contact creditors proactively to discuss payment options');
        actions.push('Research local assistance programs for future need');
        break;
    }
    
    return actions;
  }
  
  /**
   * Get emergency phone numbers
   */
  private getEmergencyPhones(billTypes: string[]): string[] {
    const phones = [
      '2-1-1 - General emergency assistance and referrals'
    ];
    
    if (billTypes.includes('electric') || billTypes.includes('gas') || billTypes.includes('water')) {
      phones.push('1-866-674-6327 - National Energy Assistance Referral (NEAR) hotline');
    }
    
    if (billTypes.includes('rent') || billTypes.includes('mortgage')) {
      phones.push('1-888-995-4673 - National Housing Resource Center');
    }
    
    phones.push('1-800-388-2227 - National Foundation for Credit Counseling');
    
    return phones;
  }
  
  /**
   * Get online resources
   */
  private getOnlineResources(billTypes: string[]): string[] {
    const resources = [
      'https://www.211.org - Find local assistance programs by zip code'
    ];
    
    if (billTypes.includes('electric') || billTypes.includes('gas') || billTypes.includes('water')) {
      resources.push('https://www.acf.hhs.gov/ocs/programs/liheap - Low Income Home Energy Assistance Program');
      resources.push('https://www.energyoutreach.org - Energy assistance programs by state');
    }
    
    if (billTypes.includes('rent') || billTypes.includes('mortgage')) {
      resources.push('https://www.hud.gov/topics/rental_assistance - HUD rental assistance programs');
      resources.push('https://www.consumerfinance.gov/coronavirus/mortgage-and-housing-assistance/ - Mortgage assistance');
    }
    
    resources.push('https://www.feedingamerica.org/find-your-local-foodbank - Find local food bank');
    resources.push('https://www.benefits.gov - Government benefits eligibility screening');
    
    return resources;
  }
  
  /**
   * Get local resource search terms
   */
  private getLocalResources(billTypes: string[]): string[] {
    const searches = [
      'Search "[your city] emergency financial assistance"',
      'Search "[your city] utility assistance programs"',
      'Contact local churches - many have emergency assistance funds'
    ];
    
    if (billTypes.includes('rent') || billTypes.includes('mortgage')) {
      searches.push('Search "[your city] rental assistance" or "[your city] housing assistance"');
      searches.push('Contact local community action agency');
    }
    
    if (billTypes.includes('electric') || billTypes.includes('gas') || billTypes.includes('water')) {
      searches.push('Call your utility company directly - many have hardship programs');
    }
    
    return searches;
  }
  
  /**
   * Get follow-up steps
   */
  private getFollowUpSteps(severity: string): string[] {
    const steps: string[] = [];
    
    switch (severity) {
      case 'EMERGENCY':
        steps.push('Document all assistance applications and reference numbers');
        steps.push('Follow up daily on emergency assistance applications');
        steps.push('Keep receipts for any payments made');
        steps.push('Consider legal aid consultation if facing eviction/foreclosure');
        break;
        
      case 'CRISIS':
        steps.push('Follow up weekly on assistance applications');
        steps.push('Maintain communication with all creditors');
        steps.push('Track payment plan agreements in writing');
        steps.push('Build list of backup resources for future emergencies');
        break;
        
      case 'URGENT':
        steps.push('Create written payment plan with creditors');
        steps.push('Research additional income opportunities');
        steps.push('Start building small emergency fund when possible');
        steps.push('Consider credit counseling consultation');
        break;
    }
    
    return steps;
  }
  
  /**
   * Get specific utility assistance resources
   */
  getUtilityAssistance(): EmergencyResource[] {
    return [
      {
        name: 'LIHEAP (Low Income Home Energy Assistance)',
        phone: '1-866-674-6327',
        website: 'https://www.acf.hhs.gov/ocs/programs/liheap',
        description: 'Federal program helping with heating/cooling bills',
        eligibility: 'Low-income households (usually under 150% of poverty level)',
        howToApply: 'Apply through local LIHEAP office - find yours at acf.hhs.gov',
        urgency: 'WITHIN_WEEK'
      },
      {
        name: 'Utility Hardship Programs',
        description: 'Most utility companies have programs for customers in crisis',
        eligibility: 'Varies by company - call to ask about options',
        howToApply: 'Call customer service and ask about "hardship programs" or "payment assistance"',
        urgency: 'IMMEDIATE'
      },
      {
        name: 'Salvation Army',
        phone: '1-800-SAL-ARMY',
        website: 'https://www.salvationarmyusa.org',
        description: 'Emergency financial assistance including utility payments',
        eligibility: 'Crisis situation, varies by location',
        howToApply: 'Call local Salvation Army office with documentation of shutoff notice',
        urgency: 'SAME_DAY'
      }
    ];
  }
  
  /**
   * Get housing assistance resources
   */
  getHousingAssistance(): EmergencyResource[] {
    return [
      {
        name: 'Emergency Rental Assistance',
        website: 'https://home.treasury.gov/policy-issues/coronavirus/assistance-for-state-local-and-tribal-governments/emergency-rental-assistance-program',
        description: 'Government program helping with back rent and utilities',
        eligibility: 'Low/moderate income households affected by COVID-19',
        howToApply: 'Apply through your state/local ERA program - find yours at treasury.gov',
        urgency: 'WITHIN_WEEK'
      },
      {
        name: 'Local Housing Authority',
        description: 'Public housing and voucher programs',
        eligibility: 'Low-income households, long waiting lists',
        howToApply: 'Search "[your city] housing authority" and apply for waiting list',
        urgency: 'WITHIN_WEEK'
      },
      {
        name: 'Legal Aid for Eviction Defense',
        description: 'Free legal help to fight evictions',
        eligibility: 'Low-income tenants facing eviction',
        howToApply: 'Search "[your city] legal aid" or "[your state] eviction help"',
        urgency: 'IMMEDIATE'
      }
    ];
  }
  
  /**
   * Get creditor negotiation tips
   */
  getCreditorNegotiationTips(): string[] {
    return [
      'Be honest about your financial situation - creditors often prefer payment plans to nothing',
      'Ask specifically about "hardship programs" - many companies have them',
      'Get any payment arrangement in writing before making payments',
      'Don\'t promise more than you can actually pay - be realistic',
      'If first person says no, ask to speak to a supervisor or retention department',
      'Document everything - names, dates, reference numbers, agreements',
      'Consider non-profit credit counseling if multiple creditors involved'
    ];
  }
}