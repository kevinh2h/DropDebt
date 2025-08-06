/**
 * Emergency Budget Resources
 * 
 * Provides location-specific assistance programs and emergency resources
 * for users facing budget crises
 */

export interface EmergencyResource {
  id: string;
  name: string;
  description: string;
  phone?: string;
  website?: string;
  eligibility: string;
  assistanceType: 'utility' | 'food' | 'housing' | 'medical' | 'financial' | 'general';
  isNational: boolean;
  coverage?: string; // Geographic coverage if not national
}

export interface CrisisAssessment {
  severityLevel: 'MODERATE' | 'SEVERE' | 'CRITICAL';
  primaryNeeds: string[];
  timeframe: 'IMMEDIATE' | 'WITHIN_WEEK' | 'WITHIN_MONTH';
  recommendedResources: EmergencyResource[];
  actionPlan: string[];
}

export class EmergencyResourceProvider {
  
  private nationalResources: EmergencyResource[] = [
    {
      id: 'dial-211',
      name: '2-1-1 Information and Referral',
      description: 'Comprehensive information and referral service for emergency assistance, food, housing, utilities, and healthcare',
      phone: '2-1-1',
      website: 'https://www.211.org',
      eligibility: 'Available to all residents',
      assistanceType: 'general',
      isNational: true
    },
    {
      id: 'salvation-army',
      name: 'The Salvation Army',
      description: 'Emergency financial assistance, food, shelter, and utility assistance',
      phone: '1-800-SAL-ARMY',
      website: 'https://www.salvationarmyusa.org',
      eligibility: 'Low-income individuals and families',
      assistanceType: 'general',
      isNational: true
    },
    {
      id: 'snap-benefits',
      name: 'SNAP (Food Stamps)',
      description: 'Monthly food assistance benefits for eligible low-income households',
      website: 'https://www.fns.usda.gov/snap',
      eligibility: 'Income below 130% of federal poverty line',
      assistanceType: 'food',
      isNational: true
    },
    {
      id: 'liheap',
      name: 'Low Income Home Energy Assistance Program (LIHEAP)',
      description: 'Help paying heating and cooling bills, weatherization, and energy-related home repairs',
      website: 'https://www.acf.hhs.gov/ocs/programs/liheap',
      eligibility: 'Low-income households',
      assistanceType: 'utility',
      isNational: true
    },
    {
      id: 'wic',
      name: 'WIC (Women, Infants, and Children)',
      description: 'Nutrition assistance for pregnant women, new mothers, and children under 5',
      website: 'https://www.fns.usda.gov/wic',
      eligibility: 'Pregnant/postpartum women, infants, children under 5 at nutritional risk',
      assistanceType: 'food',
      isNational: true
    },
    {
      id: 'hud-assistance',
      name: 'HUD Housing Assistance',
      description: 'Rental assistance, public housing, and foreclosure prevention',
      website: 'https://www.hud.gov/topics/rental_assistance',
      eligibility: 'Low-income households, varies by program',
      assistanceType: 'housing',
      isNational: true
    },
    {
      id: 'community-health-centers',
      name: 'Federally Qualified Health Centers (FQHC)',
      description: 'Low-cost healthcare services regardless of ability to pay',
      website: 'https://findahealthcenter.hrsa.gov',
      eligibility: 'All residents, sliding fee scale available',
      assistanceType: 'medical',
      isNational: true
    },
    {
      id: 'nfcc-counseling',
      name: 'National Foundation for Credit Counseling (NFCC)',
      description: 'Non-profit credit counseling, debt management, and financial education',
      phone: '1-800-388-2227',
      website: 'https://www.nfcc.org',
      eligibility: 'All consumers',
      assistanceType: 'financial',
      isNational: true
    }
  ];

  /**
   * Assess crisis severity and recommend appropriate resources
   */
  assessCrisis(
    totalIncome: number,
    totalExpenses: number,
    availableForDebt: number,
    requiredPayments: number,
    hasChildren: boolean = false,
    hasUtilityShutoffRisk: boolean = false,
    hasEvictionRisk: boolean = false
  ): CrisisAssessment {
    
    const shortfall = requiredPayments - availableForDebt;
    const expenseToIncomeRatio = totalExpenses / totalIncome;
    
    // Determine severity level
    let severityLevel: 'MODERATE' | 'SEVERE' | 'CRITICAL';
    let timeframe: 'IMMEDIATE' | 'WITHIN_WEEK' | 'WITHIN_MONTH';
    
    if (hasUtilityShutoffRisk || hasEvictionRisk || shortfall > totalIncome * 0.5) {
      severityLevel = 'CRITICAL';
      timeframe = 'IMMEDIATE';
    } else if (shortfall > availableForDebt || expenseToIncomeRatio > 1.2) {
      severityLevel = 'SEVERE'; 
      timeframe = 'WITHIN_WEEK';
    } else {
      severityLevel = 'MODERATE';
      timeframe = 'WITHIN_MONTH';
    }
    
    // Identify primary needs
    const primaryNeeds: string[] = [];
    if (hasUtilityShutoffRisk) primaryNeeds.push('utility_assistance');
    if (hasEvictionRisk) primaryNeeds.push('housing_assistance');
    if (expenseToIncomeRatio > 1.0) primaryNeeds.push('food_assistance');
    if (shortfall > availableForDebt * 2) primaryNeeds.push('financial_counseling');
    if (hasChildren) primaryNeeds.push('family_assistance');
    
    // Select appropriate resources
    const recommendedResources = this.getResourcesForNeeds(primaryNeeds, severityLevel);
    
    // Create action plan
    const actionPlan = this.generateActionPlan(severityLevel, primaryNeeds, timeframe);
    
    return {
      severityLevel,
      primaryNeeds,
      timeframe,
      recommendedResources,
      actionPlan
    };
  }
  
  /**
   * Get resources that match specific needs
   */
  private getResourcesForNeeds(needs: string[], severity: string): EmergencyResource[] {
    const resources: EmergencyResource[] = [];
    
    // Always include 2-1-1 for comprehensive help
    resources.push(this.nationalResources.find(r => r.id === 'dial-211')!);
    
    if (needs.includes('utility_assistance')) {
      resources.push(this.nationalResources.find(r => r.id === 'liheap')!);
    }
    
    if (needs.includes('food_assistance')) {
      resources.push(this.nationalResources.find(r => r.id === 'snap-benefits')!);
      if (needs.includes('family_assistance')) {
        resources.push(this.nationalResources.find(r => r.id === 'wic')!);
      }
    }
    
    if (needs.includes('housing_assistance')) {
      resources.push(this.nationalResources.find(r => r.id === 'hud-assistance')!);
    }
    
    if (needs.includes('financial_counseling') || severity === 'CRITICAL') {
      resources.push(this.nationalResources.find(r => r.id === 'nfcc-counseling')!);
    }
    
    // Add general assistance for severe/critical cases
    if (severity === 'SEVERE' || severity === 'CRITICAL') {
      resources.push(this.nationalResources.find(r => r.id === 'salvation-army')!);
      resources.push(this.nationalResources.find(r => r.id === 'community-health-centers')!);
    }
    
    return resources;
  }
  
  /**
   * Generate step-by-step action plan
   */
  private generateActionPlan(
    severity: string,
    needs: string[],
    timeframe: string
  ): string[] {
    const actions: string[] = [];
    
    if (severity === 'CRITICAL') {
      actions.push('IMMEDIATE: Call 2-1-1 right now for emergency assistance referrals');
      
      if (needs.includes('utility_assistance')) {
        actions.push('TODAY: Contact your utility companies to prevent shutoffs - many have emergency payment programs');
      }
      
      if (needs.includes('housing_assistance')) {
        actions.push('TODAY: Contact your landlord/mortgage company to discuss emergency payment arrangements');
      }
      
      actions.push('THIS WEEK: Apply for SNAP benefits and local food assistance programs');
      actions.push('THIS WEEK: Visit local Salvation Army or Catholic Charities for emergency financial aid');
      actions.push('WITHIN 3 DAYS: Schedule appointment with non-profit credit counselor');
      
    } else if (severity === 'SEVERE') {
      actions.push('WITHIN 24 HOURS: Call 2-1-1 to identify local assistance programs');
      actions.push('THIS WEEK: Contact creditors to negotiate payment plans before accounts become delinquent');
      actions.push('THIS WEEK: Apply for utility assistance programs (LIHEAP) if eligible');
      actions.push('WITHIN 2 WEEKS: Schedule credit counseling appointment');
      
    } else { // MODERATE
      actions.push('WITHIN WEEK: Research local assistance programs by calling 2-1-1');
      actions.push('WITHIN 2 WEEKS: Contact creditors proactively to discuss payment options');
      actions.push('WITHIN MONTH: Consider credit counseling to create sustainable budget plan');
    }
    
    // Always add these
    actions.push('ONGOING: Track all expenses daily to identify areas for reduction');
    actions.push('ONGOING: Look for additional income opportunities (gig work, benefit programs)');
    
    return actions;
  }
  
  /**
   * Get all national resources
   */
  getAllNationalResources(): EmergencyResource[] {
    return [...this.nationalResources];
  }
  
  /**
   * Format resources for display
   */
  formatResourcesForUser(resources: EmergencyResource[]): string {
    return resources.map(resource => {
      let formatted = `📞 ${resource.name}`;
      if (resource.phone) formatted += ` - ${resource.phone}`;
      if (resource.website) formatted += `\n   🌐 ${resource.website}`;
      formatted += `\n   ℹ️  ${resource.description}`;
      formatted += `\n   👥 ${resource.eligibility}`;
      return formatted;
    }).join('\n\n');
  }
}

// Export singleton instance
export const emergencyResourceProvider = new EmergencyResourceProvider();