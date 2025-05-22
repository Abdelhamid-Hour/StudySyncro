import { globalTooltip } from '../../../global/js/dom-variables';
import { showTooltip } from '../../../global/js/utils';
import { levelValues, visibilityValues } from '../group-chat/js/dom-variables';

export const getGroupOverlay = () => `
<div class="create-group-overlay overlay-model">
    <header>
        <h2>Create New Group</h2>
        <button type="button" class="exclude-btn close-group-overlay">
            <i class="bi bi-x-lg"></i>
        </button>
    </header>
    <div class="create-group-form">
        <form>
            <div class="field-container group-name-field">
                <div class="field-icon-container">
                    <span class="icon-box">
                        <i class="bi bi-people"></i>
                        <i class="bi bi-info-circle"></i>
                    </span>
                </div>
                <input
                    type="text"
                    
                    id="group-name"
                    name="group-name"
                    class="input"
                    placeholder="Group Name"
                />
            </div>
            <div class="field-container group-description-field">
                <div class="field-icon-container">
                    <span class="icon-box">
                        <i class="bi bi-people"></i>
                        <i class="bi bi-info-circle"></i>
                    </span>
                </div>
                <textarea
                    
                    id="group-description"
                    name="group-description"
                    class="input"
                    placeholder="Describe your group (e.g. purpose, topics, goals)"
                ></textarea>
                <span class="chars-limit">0/500</span>
            </div>
            <div class="dual-container">
                <div class="field-container group-subject-field">
                    <div class="field-icon-container">
                        <i class="bi bi-journal-text"></i>
                    </div>
                    <div class="select-trigger input">
                        <button type="button" class="exclude-btn open-select-btn">
                            <span class="subject-value">Subject</span>
                            <input type="hidden" name="sebject" value="" />
                            <i class="bi bi-chevron-down"></i>
                        </button>
                    </div>
                    <div
                        class="select-menu group-subject-select-menu drop-down-menu overlay"
                    ></div>
                </div>
                <div class="field-container group-level-field">
                    <div class="field-icon-container">
                        <i class="bi bi-graph-up"></i>
                    </div>
                    <span class="level-input input">Beginner</span>
                    <input type="hidden" name="level" value="Beginner" />
                    <button
                        type="button"
                        data-tooltip=""
                        class="exclude-btn switch-btn has-tooltip"
                    >
                        <i class="bi bi-arrow-left-right"></i>
                    </button>
                </div>
            </div>
            <div class="dual-container">
                <div class="field-container group-max-members-field">
                    <div class="field-icon-container">
                        <i class="bi bi-lock"></i>
                    </div>
                    <input
                        
                        type="number"
                        min="1"
                        max="1000"
                        class="input"
                        placeholder="Max Members"
                        name="max-members"
                    />
                </div>
                <div class="field-container group-visibility-field">
                    <div class="field-icon-container">
                        <i class="bi bi-eye"></i>
                    </div>
                        <span class="visibility-input input">Public</span>
                    <input type="hidden" name="visibility" value="Public" />
                    <button
                        type="button"
                        data-tooltip=""
                        class="exclude-btn switch-btn has-tooltip"
                    >
                        <i class="bi bi-arrow-left-right"></i>
                    </button>
                </div>
            </div>
            <button type="submit" class="blue-btn create-btn">Create</button>
        </form>
    </div>
</div>
`;

const chechGroupValues = ({
  groupName,
  description,
  subject,
  level,
  maxMembers,
  visibility,
}) => {
  let error = ''
  let input = null
  const groupNameValue = groupName?.value ?? '';
  const descriptionValue = description?.value ?? '';
  const subjectValue = subject?.value ?? '';
  const levelValue = level?.value ?? '';
  const maxMembersValue = maxMembers?.value ?? '';
  const visibilityValue = visibility?.value ?? '';

  if (!groupNameValue.trim()) {
    input = groupName;
    error = 'Group name is required.';
  } else if (groupNameValue.length > 50) {
    input = groupName;
    error = 'Group name must be less than 50 characters.';
  } else if (!descriptionValue.trim()) {
    input = description;
    error = 'Description is required.';
  } else if (descriptionValue.length > 500) {
    input = description;
    error = 'Description must be less than 500 characters.';
  } else if (!subjectValue.trim()) {
    input = subject;
    error = 'Subject is required.';
  } else if (!levelValues.includes(levelValue)) {
    input = level;
    error = 'Level is not valid.';
  } else if (
    isNaN(Number(maxMembersValue)) ||
    Number(maxMembersValue) < 2 ||
    Number(maxMembersValue) > 1000
  ) {
    input = maxMembers;
    error = 'Max members must be a number between 2 and 1000.';
  } else if (!visibilityValues.includes(visibilityValue)) {
    input = visibility;
    error = 'Visibility is not valid.';
  }
// !! complateuuuuuu
  if (error) {
    input?.focus();
    input.classList.add('');
    showTooltip(input, globalTooltip);
    return false;
  }
  return true;
};