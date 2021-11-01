This is a stateless application for browsing the ACI Managed Object (MO) tree as implemented by APIC configuration.

The App allows the user to browse the MO tree much like Visore but in an graphical form showing links between parents and children, but also relationship objects and fault counts for each object with color coding based on the most critical active fault type for an MO.

The App allows access to all ‘root’s with the common ones being polUni and fabricTopology. This is a full view of all MO’s implemented in the APIC and can be used to:

* Troubleshoot where configuration objects have been missed, the browser makes it easy to follow a path in the tree to find broken links in the MO chain. 

* For building scripts, this allows full insight into the information model and provides links to the specific page in the MIM on the Cisco website. 

* To gain a better understanding of how the APIC manages the configuration.

* Provides query filter abilities therefore providing a graphical MOQuery type tool.

Full documentation can be found at: https://haystacknetworks.com/cisco-apic-managed-object-browser
