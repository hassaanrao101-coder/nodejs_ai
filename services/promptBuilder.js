// services/promptBuilder.js

/**
 * Maps query parameters to dental modification descriptions for AI prompt
 */
class PromptBuilder {
  constructor(queryParams) {
    this.params = queryParams;
    this.modifications = [];
  }

  /**
   * Build complete prompt for dental image modification
   * @returns {string} Formatted prompt for AI
   */
  build() {
    // Extract arch selection
    const arch = this.getArch();
    
    // Extract number of teeth
    const teethCount = this.getTeethCount();
    
    // Build modifications array
    this.addBrighteningModification();
    this.addWidenModification();
    this.addSpacingModification();
    this.addAlignmentModification();
    this.addMissingTeethModification();
    this.addGummySmileModification();
    this.addIncisorShapeModification();
    this.addGumRecessionModification();
    this.addBiteCorrection();

    // Construct final prompt
    const prompt = this.constructPrompt(arch, teethCount);
    
    return prompt;
  }

  /**
   * Get arch selection (upper, lower, both)
   */
  getArch() {
    const arch = (this.params.arch || 'upper').toLowerCase();
    if (!['upper', 'lower', 'both'].includes(arch)) {
      return 'upper'; // default
    }
    return arch;
  }

  /**
   * Get number of teeth to modify
   */
  getTeethCount() {
    const count = this.params.teeth_count || this.params.number_of_teeth || '6';
    
    if (count === 'full' || count === 'full_arch') {
      return 'full arch';
    }
    
    const numCount = parseInt(count);
    if (isNaN(numCount) || numCount < 2 || numCount > 10) {
      return '6'; // default
    }
    
    return numCount.toString();
  }

  /**
   * Add teeth brightening modification
   */
  addBrighteningModification() {
    const brighten = (this.params.brighten || '').toLowerCase();
    
    const brightenMap = {
      'subtle': 'Slightly brighten teeth to a subtle natural white',
      'natural': 'Brighten teeth to a natural healthy white shade',
      'strong': 'Significantly brighten teeth to a bright, vibrant white'
    };

    if (brightenMap[brighten]) {
      this.modifications.push(brightenMap[brighten]);
    }
  }

  /**
   * Add teeth widening modifications
   */
  addWidenModification() {
    const widenUpper = this.params.widen_upper_teeth === 'true';
    const widenLower = this.params.widen_lower_teeth === 'true';

    if (widenUpper) {
      this.modifications.push('Widen the upper teeth to create a fuller smile');
    }
    if (widenLower) {
      this.modifications.push('Widen the lower teeth proportionally');
    }
  }

  /**
   * Add spacing modifications
   */
  addSpacingModification() {
    const closeSpaces = this.params.close_spaces_evenly === 'true';
    
    if (closeSpaces) {
      this.modifications.push('Close gaps between teeth by redistributing space evenly');
    }
  }

  /**
   * Add alignment/crowding corrections
   */
  addAlignmentModification() {
    const crowding = (this.params.correct_crowding_with_alignment || '').toLowerCase();
    
    const crowdingMap = {
      'mild': 'Correct mild crowding by slightly straightening teeth',
      'moderate': 'Correct moderate crowding by aligning and straightening teeth',
      'severe': 'Correct severe crowding with significant alignment improvements'
    };

    if (crowdingMap[crowding]) {
      this.modifications.push(crowdingMap[crowding]);
    }
  }

  /**
   * Add missing teeth replacement
   */
  addMissingTeethModification() {
    const replaceMissing = this.params.replace_missing_teeth === 'true';
    
    if (replaceMissing) {
      this.modifications.push('Replace any missing teeth with natural-looking prosthetics');
    }
  }

  /**
   * Add gummy smile reduction
   */
  addGummySmileModification() {
    const reduceGummy = this.params.reduce_gummy_smile === 'true';
    
    if (reduceGummy) {
      this.modifications.push('Reduce excessive gum display for a balanced gum-to-tooth ratio');
    }
  }

  /**
   * Add incisal edge improvements
   */
  addIncisorShapeModification() {
    const improveShape = this.params.improve_shape_of_incisal_edges === 'true';
    
    if (improveShape) {
      this.modifications.push('Improve the shape of incisal edges for a more youthful appearance');
    }
  }

  /**
   * Add gum recession correction
   */
  addGumRecessionModification() {
    const improveRecession = this.params.improve_gum_recession === 'true';
    
    if (improveRecession) {
      this.modifications.push('Restore gum tissue to cover exposed tooth roots naturally');
    }
  }

  /**
   * Add bite corrections
   */
  addBiteCorrection() {
    const correctUnderbite = this.params.correct_underbite === 'true';
    const correctOverbite = this.params.correct_overbite === 'true';

    if (correctUnderbite) {
      this.modifications.push('Correct underbite by repositioning lower jaw alignment');
    }
    if (correctOverbite) {
      this.modifications.push('Correct overbite by adjusting upper teeth positioning');
    }
  }

  /**
   * Construct final prompt from all modifications
   */
  constructPrompt(arch, teethCount) {
    const archText = arch === 'both' ? 'both upper and lower arches' : `${arch} arch`;
    
    let prompt = `You are a professional dental imaging AI. Modify this dental photograph following these specifications:\n\n`;
    prompt += `Target Area: ${archText}\n`;
    prompt += `Number of Teeth to Modify: ${teethCount}\n\n`;
    
    if (this.modifications.length > 0) {
      prompt += `Modifications:\n`;
      this.modifications.forEach((mod, index) => {
        prompt += `${index + 1}. ${mod}\n`;
      });
    } else {
      prompt += `Apply natural, conservative improvements to create a healthy, attractive smile.\n`;
    }
    
    prompt += `\nIMPORTANT: Maintain natural dental aesthetics, realistic proportions, and ensure all modifications blend seamlessly. The result should look professionally done but naturally achievable.`;
    
    return prompt;
  }

  /**
   * Validate if query parameters are valid
   */
  static validate(queryParams) {
    const errors = [];
    
    // Validate arch
    if (queryParams.arch) {
      const validArchs = ['upper', 'lower', 'both'];
      if (!validArchs.includes(queryParams.arch.toLowerCase())) {
        errors.push('Invalid arch value. Must be: upper, lower, or both');
      }
    }
    
    // Validate teeth count
    if (queryParams.teeth_count || queryParams.number_of_teeth) {
      const count = queryParams.teeth_count || queryParams.number_of_teeth;
      if (count !== 'full' && count !== 'full_arch') {
        const numCount = parseInt(count);
        if (isNaN(numCount) || numCount < 2 || numCount > 10) {
          errors.push('Invalid teeth count. Must be between 2-10 or "full"');
        }
      }
    }
    
    // Validate brighten level
    if (queryParams.brighten) {
      const validLevels = ['subtle', 'natural', 'strong'];
      if (!validLevels.includes(queryParams.brighten.toLowerCase())) {
        errors.push('Invalid brighten value. Must be: subtle, natural, or strong');
      }
    }

     if (queryParams.correct_crowding_with_alignment) {
      const validLevels = ['mild' , 'moderate' , 'severe' ];
      if (!validLevels.includes(queryParams.correct_crowding_with_alignment.toLowerCase())) {
        errors.push('Invalid crowding with alignment value. Must be: mild, moderate or severe ');
      }
    }
        
    // Validate all boolean parameters
    const booleanParams = [
      'widen_upper_teeth',
      'widen_lower_teeth',
      'close_spaces_evenly',
      'replace_missing_teeth',
      'reduce_gummy_smile',
      'improve_shape_of_incisal_edges',
      'improve_gum_recession',
      'correct_underbite',
      'correct_overbite'
    ];
    
    booleanParams.forEach(param => {
      if (queryParams[param] !== undefined) {
        const value = queryParams[param].toLowerCase();
        if (value !== 'true' && value !== 'false') {
          errors.push(`Invalid ${param} value. Must be: true or false`);
        }
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = PromptBuilder;