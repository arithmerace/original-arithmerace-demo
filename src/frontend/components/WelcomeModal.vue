<template>
<form action="">
  <div class="modal-card" style="width: auto">
    <header class="modal-card-head">
      <p class="modal-card-title center">Welcome to Arithmerace!</p>
    </header>
    <section class="modal-card-body">
      <p class="center">Before you can get started, we need to know how much math you know. Please check all skills and topics that you know well enough to solve problems with. These will be used in the future to automatically place you in races with people with a similar knowledge level. As you learn new topics, you can update this list in your profile.</p>
      <br>
      <b-field label="What skills do you know?" class="skills-field">
        <div class="columns">
          <div class="column">
            <b-checkbox v-for="skill in c1skills" v-model="userSkills[skill.skillid]" :key="skill.skillid">{{ skill.skillname }}</b-checkbox>
          </div>
          <div class="column">
            More skills coming soon!
            <b-checkbox v-for="skill in c2skills" v-model="userSkills[skill.skillid]" :key="skill.skillid">{{ skill.skillname }}</b-checkbox>
          </div>
        </div>
      </b-field>
      <p class="bottom-message">Thanks for racing, and have fun!</p>
    </section>
    <footer class="modal-card-foot">
      <button class="button" type="button" @click="$parent.close()">Not Now</button>
      <button class="button is-info" type="button" @click="submit">Done</button>
    </footer>
  </div>
</form>
</template>

<script>
import { fireDb, fireAuth } from '~/plugins/firebase'
export default {
  name: 'WelcomeModal',
  data() {
    return {
      c1skills: [
        { skillid: 'addsubtract12', skillname: 'Addition and subtraction with 1 through 12' },
        { skillid: 'multdiv12', skillname: 'Multiplication and division with 1 through 12' },
        { skillid: 'addsubtractnegative12', skillname: 'Addition and subtraction with -12 through +12' },
        { skillid: 'multdivnegative12', skillname: 'Multiplication and division with -12 through +12' }
      ],
      c2skills: [
        
      ],
      c3skills: [
        
      ],
      userSkills: {}
    }
  },
  methods: {
    submit() {
      fireDb().ref('/user/' + fireAuth().currentUser.uid + '/career/skills').set(this.userSkills)
        .then(() => {
          this.$parent.close()
          this.$toast.open({
            type: 'is-success',
            queue: false,
            message: 'Thanks for choosing your skills. They  will be used in the future to personalize your races.',
            duration: 4000
          })
          this.$router.push('/')
        })
        .catch(err => alert('Uh oh. Something went wrong. SetSkills:' + err, this))
    }
  }
}
</script>

<style scoped>
.center {
  text-align: center;
}
.skills-field {
  padding-top: 10px;
  border-top: 1px solid gray;
}
.bottom-message {
  padding-top: 10px;
  border-top: 1px solid gray;
}
</style>
